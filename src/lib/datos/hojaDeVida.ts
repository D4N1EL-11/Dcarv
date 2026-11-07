import { ANIOS_OBSOLESCENCIA, DIAS_AVISO_GARANTIA } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { normalizarCodigo } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, sumarDias } from '@/lib/reglas/fechas';
import { validarHojaDeVida, type HojaDeVida } from '@/lib/reglas/hojaDeVida';
import { registrarEvento } from './eventos';

// Hoja de vida técnica de cada equipo (M15) y lo que ha costado repararlo.

export type FichaTecnica = HojaDeVida & {
  // Suma de las piezas usadas en sus casos, con el costo congelado al usarlas.
  costoReparaciones: number;
  repuestosUsados: number;
};

const COLUMNAS = `e.marca_modelo AS "marcaModelo", e.procesador, e.ram_gb AS "ramGb", e.disco_gb AS "discoGb",
  e.sistema_operativo AS "sistemaOperativo", e.numero_serie AS "numeroSerie",
  e.fecha_compra AS "fechaCompra", e.garantia_hasta AS "garantiaHasta"`;

export async function obtenerHojaDeVida(codigo: string): Promise<FichaTecnica> {
  const [fila] = await consultar<FichaTecnica & { costoReparaciones: string }>(
    `SELECT ${COLUMNAS},
            COALESCE((SELECT SUM(u.cantidad * u.costo_unitario) FROM repuestos_usados u
                        JOIN incidencias i ON i.id = u.incidencia_id WHERE i.equipo_id = e.id), 0) AS "costoReparaciones",
            COALESCE((SELECT SUM(u.cantidad) FROM repuestos_usados u
                        JOIN incidencias i ON i.id = u.incidencia_id WHERE i.equipo_id = e.id), 0)::int AS "repuestosUsados"
       FROM equipos e
      WHERE e.codigo = $1`,
    [normalizarCodigo(codigo)],
  );
  if (!fila) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  // NUMERIC llega como texto (pg no lo convierte para no perder precisión).
  return { ...fila, costoReparaciones: Number(fila.costoReparaciones) };
}

export async function actualizarHojaDeVida(codigo: string, hoja: HojaDeVida): Promise<void> {
  validarHojaDeVida(hoja, hoyBogota());
  const limpio = normalizarCodigo(codigo);
  await conTransaccion(async (tx) => {
    const { rowCount } = await tx.query(
      `UPDATE equipos SET marca_modelo = $2, procesador = $3, ram_gb = $4, disco_gb = $5, sistema_operativo = $6,
              numero_serie = $7, fecha_compra = $8, garantia_hasta = $9
        WHERE codigo = $1`,
      [
        limpio,
        hoja.marcaModelo,
        hoja.procesador,
        hoja.ramGb,
        hoja.discoGb,
        hoja.sistemaOperativo,
        hoja.numeroSerie,
        hoja.fechaCompra,
        hoja.garantiaHasta,
      ],
    );
    if (!rowCount) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
    await registrarEvento(tx, { accion: 'hoja_de_vida', equipoCodigo: limpio });
  });
}

export type AvisoEquipo = {
  codigo: string;
  sala: string;
  fechaCompra: string | null;
  garantiaHasta: string | null;
};

// Equipos en servicio con la garantía por vencer (o vencida en el último mes) y equipos con
// ANIOS_OBSOLESCENCIA años o más desde la compra. Para la página de alertas.
export async function avisosDeHojaDeVida(hoy = hoyBogota()): Promise<{ garantias: AvisoEquipo[]; obsoletos: AvisoEquipo[] }> {
  const base = `SELECT e.codigo, s.nombre AS sala, e.fecha_compra AS "fechaCompra", e.garantia_hasta AS "garantiaHasta"
                  FROM equipos e JOIN salas s ON s.id = e.sala_id
                 WHERE e.estado <> 'dado_de_baja'`;
  const [garantias, obsoletos] = await Promise.all([
    consultar<AvisoEquipo>(`${base} AND e.garantia_hasta BETWEEN $1::date AND $2::date ORDER BY e.garantia_hasta, e.codigo`, [
      sumarDias(hoy, -30),
      sumarDias(hoy, DIAS_AVISO_GARANTIA),
    ]),
    // make_interval resuelve bien el 29 de febrero.
    consultar<AvisoEquipo>(
      `${base} AND e.fecha_compra <= ($1::date - make_interval(years => $2::int)) ORDER BY e.fecha_compra, e.codigo`,
      [hoy, ANIOS_OBSOLESCENCIA],
    ),
  ]);
  return { garantias, obsoletos };
}
