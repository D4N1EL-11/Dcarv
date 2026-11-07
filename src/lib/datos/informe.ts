import { DIAS_REASIGNACION, META_HORAS_PRIORIDAD, ZONA_HORARIA } from '@/lib/config/soporte';
import { consultar } from '@/lib/db/conexion';
import { categoriaMasFrecuente, type CategoriaIncidencia, type PrioridadIncidencia } from '@/lib/reglas/clasificacion';
import { ETIQUETA_EQUIPO } from '@/lib/reglas/equipo';
import { mesDe, rangoDelMes, sumarMeses, type Mes } from '@/lib/reglas/informe';
import { historialMantenimientos, type FilaMantenimiento } from './mantenimiento';

// Informe mensual para la coordinación. Todo se cuenta con fechas de Bogotá: una incidencia
// cuenta en el mes de su reporte (fecha) y su cierre en el mes del día de cierre.

const CIERRE = `(i.fecha_estado AT TIME ZONE '${ZONA_HORARIA}')::date`;
const CERRADA_EN_MES = `i.estado = 'cerrada' AND ${CIERRE} BETWEEN $1::date AND $2::date`;
const REPORTADA_EN_MES = 'i.fecha BETWEEN $1::date AND $2::date';

// Tiempos de atención (SLA): horas entre el reporte y el cierre, y la meta de cada prioridad.
const HORAS_ATENCION = 'EXTRACT(EPOCH FROM (i.fecha_estado - i.created_at)) / 3600';
const META_HORAS = `CASE i.prioridad ${Object.entries(META_HORAS_PRIORIDAD)
  .map(([prioridad, horas]) => `WHEN '${prioridad}' THEN ${horas}`)
  .join(' ')} END`;
const DENTRO_DE_META = `${HORAS_ATENCION} <= ${META_HORAS}`;

export type ResumenMes = {
  reportadas: number;
  cerradas: number;
  promedioDias: number | null;
  // Cerradas dentro del plazo de reasignación (DIAS_REASIGNACION): la meta de atención.
  cerradasATiempo: number;
  // Reportadas hasta el último día del mes que seguían sin cerrar ese día.
  pendientesAlCierre: number;
};

export type FilaSalaInforme = {
  salaId: string;
  sala: string;
  equipos: number;
  reportadas: number;
  cerradas: number;
  masFrecuente: { categoria: CategoriaIncidencia; total: number } | null;
};

export type FilaTecnicoInforme = {
  tecnico: string;
  cerradas: number;
  promedioDias: number | null;
  promedioHoras: number | null;
  dentroDeMeta: number;
};
// Cierres del mes por prioridad frente a su meta de horas.
export type FilaSlaInforme = {
  prioridad: PrioridadIncidencia;
  cerradas: number;
  dentroDeMeta: number;
  promedioHoras: number | null;
};
export type FilaEquipoInforme = { codigo: string; sala: string; fallas: number };
export type FilaBajaInforme = { codigo: string; dia: string; actor: string };

export type Informe = {
  desde: string;
  hasta: string;
  resumen: ResumenMes;
  anterior: ResumenMes;
  porCategoria: Record<CategoriaIncidencia, number>;
  porPrioridad: Record<PrioridadIncidencia, number>;
  porSala: FilaSalaInforme[];
  porTecnico: FilaTecnicoInforme[];
  sla: FilaSlaInforme[];
  equiposConMasFallas: FilaEquipoInforme[];
  bajas: FilaBajaInforme[];
  mantenimientos: FilaMantenimiento[];
};

async function resumenDe(desde: string, hasta: string): Promise<ResumenMes> {
  const [fila] = await consultar<ResumenMes>(
    `SELECT COUNT(*) FILTER (WHERE ${REPORTADA_EN_MES}) AS reportadas,
            COUNT(*) FILTER (WHERE ${CERRADA_EN_MES}) AS cerradas,
            (AVG(${CIERRE} - i.fecha) FILTER (WHERE ${CERRADA_EN_MES}))::float8 AS "promedioDias",
            COUNT(*) FILTER (WHERE ${CERRADA_EN_MES} AND ${CIERRE} - i.fecha <= $3) AS "cerradasATiempo",
            COUNT(*) FILTER (WHERE i.fecha <= $2::date AND (i.estado <> 'cerrada' OR ${CIERRE} > $2::date)) AS "pendientesAlCierre"
       FROM incidencias i`,
    [desde, hasta, DIAS_REASIGNACION],
  );
  return fila ?? { reportadas: 0, cerradas: 0, promedioDias: null, cerradasATiempo: 0, pendientesAlCierre: 0 };
}

async function conteoPor<T extends string>(columna: 'categoria' | 'prioridad', desde: string, hasta: string, valores: readonly T[]) {
  const filas = await consultar<{ valor: T; total: number }>(
    `SELECT i.${columna} AS valor, COUNT(*) AS total FROM incidencias i WHERE ${REPORTADA_EN_MES} GROUP BY i.${columna}`,
    [desde, hasta],
  );
  const conteo = Object.fromEntries(valores.map((v) => [v, 0])) as Record<T, number>;
  for (const fila of filas) conteo[fila.valor] = fila.total;
  return conteo;
}

async function salasDelMes(desde: string, hasta: string): Promise<FilaSalaInforme[]> {
  const [salas, categorias] = await Promise.all([
    consultar<Omit<FilaSalaInforme, 'masFrecuente'>>(
      `SELECT s.id AS "salaId", s.nombre AS sala,
              (SELECT COUNT(*) FROM equipos q WHERE q.sala_id = s.id AND q.estado <> 'dado_de_baja') AS equipos,
              COUNT(i.id) FILTER (WHERE ${REPORTADA_EN_MES}) AS reportadas,
              COUNT(i.id) FILTER (WHERE ${CERRADA_EN_MES}) AS cerradas
         FROM salas s
         LEFT JOIN equipos e ON e.sala_id = s.id
         LEFT JOIN incidencias i ON i.equipo_id = e.id
        GROUP BY s.id, s.nombre
        ORDER BY COUNT(i.id) FILTER (WHERE ${REPORTADA_EN_MES}) DESC, s.nombre`,
      [desde, hasta],
    ),
    consultar<{ salaId: string; categoria: CategoriaIncidencia; total: number }>(
      `SELECT e.sala_id AS "salaId", i.categoria, COUNT(*) AS total
         FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
        WHERE ${REPORTADA_EN_MES}
        GROUP BY e.sala_id, i.categoria`,
      [desde, hasta],
    ),
  ]);
  const porSala = new Map<string, Partial<Record<CategoriaIncidencia, number>>>();
  for (const { salaId, categoria, total } of categorias) {
    const conteo = porSala.get(salaId) ?? {};
    conteo[categoria] = total;
    porSala.set(salaId, conteo);
  }
  return salas.map((s) => ({ ...s, masFrecuente: categoriaMasFrecuente(porSala.get(s.salaId) ?? {}) }));
}

async function slaDelMes(desde: string, hasta: string): Promise<FilaSlaInforme[]> {
  const filas = await consultar<FilaSlaInforme>(
    `SELECT i.prioridad, COUNT(*) AS cerradas,
            COUNT(*) FILTER (WHERE ${DENTRO_DE_META}) AS "dentroDeMeta",
            (AVG(${HORAS_ATENCION}))::float8 AS "promedioHoras"
       FROM incidencias i
      WHERE ${CERRADA_EN_MES}
      GROUP BY i.prioridad`,
    [desde, hasta],
  );
  // Las tres prioridades siempre, en orden, aunque alguna no tenga cierres.
  return (['alta', 'media', 'baja'] as const).map(
    (prioridad) => filas.find((f) => f.prioridad === prioridad) ?? { prioridad, cerradas: 0, dentroDeMeta: 0, promedioHoras: null },
  );
}

export async function informeMensual(mes: Mes): Promise<Informe> {
  const { desde, hasta } = rangoDelMes(mes);
  const previo = rangoDelMes(sumarMeses(mes, -1));
  const [resumen, anterior, porCategoria, porPrioridad, porSala, porTecnico, sla, equiposConMasFallas, bajas, mantenimientos] =
    await Promise.all([
      resumenDe(desde, hasta),
      resumenDe(previo.desde, previo.hasta),
      conteoPor('categoria', desde, hasta, ['hardware', 'software', 'red', 'perifericos', 'otro'] as const),
      conteoPor('prioridad', desde, hasta, ['alta', 'media', 'baja'] as const),
      salasDelMes(desde, hasta),
      consultar<FilaTecnicoInforme>(
        `SELECT t.nombre AS tecnico, COUNT(*) AS cerradas, (AVG(${CIERRE} - i.fecha))::float8 AS "promedioDias",
                (AVG(${HORAS_ATENCION}))::float8 AS "promedioHoras",
                COUNT(*) FILTER (WHERE ${DENTRO_DE_META}) AS "dentroDeMeta"
           FROM incidencias i JOIN tecnicos t ON t.id = i.tecnico_id
          WHERE ${CERRADA_EN_MES}
          GROUP BY t.id, t.nombre
          ORDER BY COUNT(*) DESC, t.nombre`,
        [desde, hasta],
      ),
      slaDelMes(desde, hasta),
      consultar<FilaEquipoInforme>(
        `SELECT e.codigo, s.nombre AS sala, COUNT(*) AS fallas
           FROM incidencias i JOIN equipos e ON e.id = i.equipo_id JOIN salas s ON s.id = e.sala_id
          WHERE ${REPORTADA_EN_MES}
          GROUP BY e.id, e.codigo, s.nombre
         HAVING COUNT(*) >= 2
          ORDER BY COUNT(*) DESC, e.codigo
          LIMIT 5`,
        [desde, hasta],
      ),
      // Las bajas salen del registro de cambios (existe desde el 5 de noviembre de 2026).
      consultar<FilaBajaInforme>(
        `SELECT equipo_codigo AS codigo, (momento AT TIME ZONE '${ZONA_HORARIA}')::date AS dia, actor
           FROM eventos
          WHERE accion = 'estado_equipo' AND equipo_codigo IS NOT NULL AND detalle LIKE $3
            AND (momento AT TIME ZONE '${ZONA_HORARIA}')::date BETWEEN $1::date AND $2::date
          ORDER BY momento`,
        [desde, hasta, `%→ ${ETIQUETA_EQUIPO.dado_de_baja}%`],
      ),
      historialMantenimientos({ desde, hasta }, 200),
    ]);
  return { desde, hasta, resumen, anterior, porCategoria, porPrioridad, porSala, porTecnico, sla, equiposConMasFallas, bajas, mantenimientos };
}

// Mes del primer registro (la primera incidencia): el selector no ofrece meses anteriores.
export async function primerMesConDatos(): Promise<Mes | null> {
  const [fila] = await consultar<{ primero: string | null }>('SELECT MIN(fecha) AS primero FROM incidencias');
  return fila?.primero ? mesDe(fila.primero) : null;
}
