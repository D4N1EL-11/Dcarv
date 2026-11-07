import { actorActual } from '@/lib/auth/contexto';
import { DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, inicioVentana } from '@/lib/reglas/fechas';
import { validarCantidad, validarExistencias, validarNombreRepuesto } from '@/lib/reglas/repuesto';
import { ACTOR_SISTEMA, registrarEvento } from './eventos';

// Repuestos (M13): existencias en bodega y piezas usadas en cada caso. Usar un repuesto descuenta
// la existencia en la misma transacción que lo anota: dos técnicos no pueden gastar la misma pieza.

export type FilaRepuesto = {
  id: string;
  nombre: string;
  existencias: number;
  minimo: number;
  // Unidades usadas en los últimos 30 días (RN-09: la misma ventana del resto del módulo).
  usados30d: number;
};

export type RepuestoUsado = {
  id: number;
  nombre: string;
  cantidad: number;
  registradoPor: string;
  momento: string; // ISO 8601 en UTC
};

export function listarRepuestos(): Promise<FilaRepuesto[]> {
  return consultar<FilaRepuesto>(
    `SELECT r.id, r.nombre, r.existencias, r.minimo,
            COALESCE((SELECT SUM(u.cantidad) FROM repuestos_usados u
                       WHERE u.repuesto_id = r.id AND u.creado_en >= $1::date), 0)::int AS "usados30d"
       FROM repuestos r
      ORDER BY r.nombre`,
    [inicioVentana(hoyBogota(), DIAS_VENTANA_ALERTA)],
  );
}

export async function contarBajoMinimo(): Promise<number> {
  const [fila] = await consultar<{ total: number }>(
    'SELECT COUNT(*) AS total FROM repuestos WHERE existencias = 0 OR existencias < minimo',
  );
  return fila?.total ?? 0;
}

export async function crearRepuesto(d: { nombre: string; existencias: number; minimo: number }): Promise<{ id: string }> {
  const nombre = validarNombreRepuesto(d.nombre);
  const existencias = validarExistencias(d.existencias);
  const minimo = validarExistencias(d.minimo, 'El mínimo debe');
  return conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      'INSERT INTO repuestos (nombre, existencias, minimo) VALUES ($1, $2, $3) RETURNING id',
      [nombre, existencias, minimo],
    );
    await registrarEvento(tx, { accion: 'repuesto_registrado', detalle: `${nombre} (${existencias} en bodega)` });
    return rows[0]!;
  });
}

// Entrada a bodega (compra o devolución) y/o cambio del mínimo.
export async function actualizarRepuesto(id: string, d: { entrada?: number | undefined; minimo?: number | undefined }) {
  const entrada = d.entrada === undefined ? 0 : validarCantidad(d.entrada);
  const minimo = d.minimo === undefined ? undefined : validarExistencias(d.minimo, 'El mínimo debe');
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ nombre: string; existencias: number }>(
      `UPDATE repuestos SET existencias = existencias + $2, minimo = COALESCE($3, minimo)
        WHERE id = $1 RETURNING nombre, existencias`,
      [id, entrada, minimo ?? null],
    );
    if (!rows[0]) throw new ErrorDeNegocio('REPUESTO_NO_ENCONTRADO');
    if (entrada) {
      await registrarEvento(tx, {
        accion: 'repuesto_entrada',
        detalle: `${entrada} × ${rows[0].nombre} (quedan ${rows[0].existencias})`,
      });
    }
  });
}

// Anota una pieza usada en un caso y la descuenta de la bodega. Un caso cerrado no admite más.
export async function usarRepuesto(numeroCaso: string, repuestoId: string, cantidad: number): Promise<void> {
  validarCantidad(cantidad);
  await conTransaccion(async (tx) => {
    const caso = await tx.query<{ id: string; estado: string; equipo: string }>(
      `SELECT i.id, i.estado, e.codigo AS equipo
         FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
        WHERE i.numero_caso = $1`,
      [numeroCaso.trim().toUpperCase()],
    );
    const incidencia = caso.rows[0];
    if (!incidencia) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
    if (incidencia.estado === 'cerrada') throw new ErrorDeNegocio('INCIDENCIA_CERRADA');
    const repuesto = await tx.query<{ nombre: string; existencias: number }>(
      'SELECT nombre, existencias FROM repuestos WHERE id = $1 FOR UPDATE',
      [repuestoId],
    );
    if (!repuesto.rows[0]) throw new ErrorDeNegocio('REPUESTO_NO_ENCONTRADO');
    const { nombre, existencias } = repuesto.rows[0];
    if (existencias < cantidad) {
      throw new ErrorDeNegocio('SIN_EXISTENCIAS', `Solo ${existencias === 1 ? 'queda 1 unidad' : `quedan ${existencias} unidades`} de ${nombre}.`);
    }
    await tx.query('UPDATE repuestos SET existencias = existencias - $1 WHERE id = $2', [cantidad, repuestoId]);
    await tx.query(
      'INSERT INTO repuestos_usados (incidencia_id, repuesto_id, cantidad, registrado_por) VALUES ($1, $2, $3, $4)',
      [incidencia.id, repuestoId, cantidad, actorActual()?.email ?? ACTOR_SISTEMA],
    );
    await registrarEvento(tx, {
      accion: 'repuesto_usado',
      numeroCaso: numeroCaso.trim().toUpperCase(),
      equipoCodigo: incidencia.equipo,
      detalle: `${cantidad} × ${nombre}`,
    });
  });
}

export function repuestosDeCaso(numeroCaso: string): Promise<RepuestoUsado[]> {
  return consultar<RepuestoUsado>(
    `SELECT u.id, r.nombre, u.cantidad, u.registrado_por AS "registradoPor",
            to_char(u.creado_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS momento
       FROM repuestos_usados u
       JOIN repuestos r ON r.id = u.repuesto_id
       JOIN incidencias i ON i.id = u.incidencia_id
      WHERE i.numero_caso = $1
      ORDER BY u.creado_en`,
    [numeroCaso.trim().toUpperCase()],
  );
}
