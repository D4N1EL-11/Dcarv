import { DIAS_ANALITICA, DIAS_MTBF, DIAS_VENTANA_ALERTA, ZONA_HORARIA } from '@/lib/config/soporte';
import { consultar } from '@/lib/db/conexion';
import {
  mtbfDias,
  nivelRiesgo,
  puntajeRiesgo,
  tendencia,
  type NivelRiesgo,
  type Tendencia,
} from '@/lib/reglas/analitica';
import { hoyBogota, inicioVentana, sumarDias } from '@/lib/reglas/fechas';
import { antiguedadAnios } from '@/lib/reglas/hojaDeVida';

// Analítica (/soporte/analitica): cuándo se reportan las fallas, cada cuánto falla cada equipo,
// hacia dónde va cada sala y qué equipos tienen más riesgo de volver a fallar.

// Celdas [día de la semana 1-7 (lunes = 1)][hora 0-23] con el número de reportes (hora de Bogotá).
export type MapaDeCalor = { celdas: number[][]; maximo: number; total: number; dias: number };

export async function mapaDeCalor(dias = DIAS_ANALITICA): Promise<MapaDeCalor> {
  const filas = await consultar<{ dia: number; hora: number; total: number }>(
    `SELECT EXTRACT(ISODOW FROM i.created_at AT TIME ZONE $2)::int AS dia,
            EXTRACT(HOUR FROM i.created_at AT TIME ZONE $2)::int AS hora,
            COUNT(*) AS total
       FROM incidencias i
      WHERE i.fecha >= $1::date
      GROUP BY 1, 2`,
    [inicioVentana(hoyBogota(), dias), ZONA_HORARIA],
  );
  const celdas = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const { dia, hora, total } of filas) celdas[dia - 1]![hora] = total;
  const valores = celdas.flat();
  return { celdas, maximo: Math.max(0, ...valores), total: valores.reduce((s, n) => s + n, 0), dias };
}

export type RiesgoEquipo = {
  codigo: string;
  sala: string;
  fallas30d: number;
  fallas90d: number;
  pendientes: number;
  mtbf: number | null;
  aniosUso: number | null;
  puntaje: number;
  nivel: NivelRiesgo;
};

// Riesgo y MTBF de cada equipo en servicio que tuvo al menos una falla en la ventana del MTBF.
export async function riesgoDeEquipos(): Promise<RiesgoEquipo[]> {
  const hoy = hoyBogota();
  const filas = await consultar<{
    codigo: string;
    sala: string;
    fechaCompra: string | null;
    fechas: string[];
    pendientes: number;
  }>(
    `SELECT e.codigo, s.nombre AS sala, e.fecha_compra AS "fechaCompra",
            ARRAY_AGG(i.fecha::text ORDER BY i.fecha) AS fechas,
            COUNT(*) FILTER (WHERE i.estado <> 'cerrada') AS pendientes
       FROM equipos e
       JOIN salas s ON s.id = e.sala_id
       JOIN incidencias i ON i.equipo_id = e.id AND i.fecha >= $1::date
      WHERE e.estado <> 'dado_de_baja'
      GROUP BY e.id, e.codigo, s.nombre, e.fecha_compra`,
    [sumarDias(hoy, -DIAS_MTBF)],
  );
  const desde30 = inicioVentana(hoy, DIAS_VENTANA_ALERTA);
  const desde90 = inicioVentana(hoy, DIAS_ANALITICA);
  return filas
    .map((f) => {
      const datos = {
        fallas30d: f.fechas.filter((d) => d >= desde30).length,
        fallas90d: f.fechas.filter((d) => d >= desde90).length,
        pendientes: f.pendientes,
        aniosUso: antiguedadAnios(f.fechaCompra, hoy),
        mtbf: mtbfDias(f.fechas),
      };
      const puntaje = puntajeRiesgo(datos);
      return { codigo: f.codigo, sala: f.sala, ...datos, puntaje, nivel: nivelRiesgo(puntaje) };
    })
    .sort((a, b) => b.puntaje - a.puntaje || a.codigo.localeCompare(b.codigo));
}

export type TendenciaSala = {
  salaId: string;
  sala: string;
  recientes: number;
  anteriores: number;
  tendencia: Tendencia;
  cambio: number | null;
};

// Reportes de los últimos 30 días frente a los 30 anteriores, por sala.
export async function tendenciaDeSalas(): Promise<TendenciaSala[]> {
  const hoy = hoyBogota();
  const corte = inicioVentana(hoy, DIAS_VENTANA_ALERTA);
  const filas = await consultar<{ salaId: string; sala: string; recientes: number; anteriores: number }>(
    `SELECT s.id AS "salaId", s.nombre AS sala,
            COUNT(i.id) FILTER (WHERE i.fecha >= $1::date) AS recientes,
            COUNT(i.id) FILTER (WHERE i.fecha >= $2::date AND i.fecha < $1::date) AS anteriores
       FROM salas s
       LEFT JOIN equipos e ON e.sala_id = s.id
       LEFT JOIN incidencias i ON i.equipo_id = e.id
      GROUP BY s.id, s.nombre
      ORDER BY s.nombre`,
    [corte, sumarDias(corte, -DIAS_VENTANA_ALERTA)],
  );
  return filas.map((f) => ({ ...f, ...tendencia(f.recientes, f.anteriores) }));
}
