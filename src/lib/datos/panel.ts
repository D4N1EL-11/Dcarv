import { DIAS_VENTANA_ALERTA, ZONA_HORARIA } from '@/lib/config/soporte';
import { consultar } from '@/lib/db/conexion';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';
import { completarSerie, type ConteoDiario, type PuntoActividad } from '@/lib/reglas/estadisticas';
import { hoyBogota, inicioVentana } from '@/lib/reglas/fechas';

// Incidencias reportadas y cerradas por día en la misma ventana de 30 días de RN-09 (el plan deja
// fuera estadísticas más largas). Una sola consulta: la reportada cuenta por su fecha de reporte;
// la cerrada, por el día (en Bogotá) de su último cambio de estado.
export async function serieActividad(): Promise<PuntoActividad[]> {
  const hoy = hoyBogota();
  const desde = inicioVentana(hoy, DIAS_VENTANA_ALERTA);
  const filas = await consultar<ConteoDiario>(
    `SELECT 'reportadas' AS tipo, fecha AS dia, COUNT(*) AS total
       FROM incidencias WHERE fecha >= $1::date
      GROUP BY fecha
     UNION ALL
     SELECT 'cerradas', (fecha_estado AT TIME ZONE $2)::date, COUNT(*)
       FROM incidencias
      WHERE estado = 'cerrada' AND fecha_estado >= ($1::date)::timestamp AT TIME ZONE $2
      GROUP BY 2`,
    [desde, ZONA_HORARIA],
  );
  return completarSerie(desde, hoy, filas);
}

export type EventoActividad = {
  tipo: 'reportada' | EstadoIncidencia;
  numeroCaso: string;
  equipoCodigo: string;
  tecnico: string | null;
  momento: string; // ISO 8601 en UTC
};

// Últimos movimientos, sin tabla de auditoría: cada incidencia aporta su reporte (created_at) y,
// si cambió después, su estado actual en fecha_estado (asignada/reasignada o cerrada).
export function actividadReciente(limite = 8): Promise<EventoActividad[]> {
  return consultar<EventoActividad>(
    `SELECT tipo, "numeroCaso", "equipoCodigo", tecnico,
            to_char(momento AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS momento
       FROM (
         SELECT 'reportada' AS tipo, i.numero_caso AS "numeroCaso", e.codigo AS "equipoCodigo",
                NULL::text AS tecnico, i.created_at AS momento
           FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
         UNION ALL
         SELECT i.estado, i.numero_caso, e.codigo, t.nombre, i.fecha_estado
           FROM incidencias i
           JOIN equipos e ON e.id = i.equipo_id
           LEFT JOIN tecnicos t ON t.id = i.tecnico_id
          WHERE i.estado <> 'abierta'
       ) AS eventos
      ORDER BY eventos.momento DESC
      LIMIT $1`,
    [limite],
  );
}
