import type { PoolClient } from 'pg';
import {
  DIAS_REASIGNACION,
  DIAS_VENTANA_ALERTA,
  INCIDENCIAS_PARA_ALERTA,
  ZONA_HORARIA,
} from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { esCandidatoABaja } from '@/lib/reglas/alertas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { diasEntre, hoyBogota, inicioVentana } from '@/lib/reglas/fechas';
import { puedeAsignarse, type EstadoIncidencia } from '@/lib/reglas/incidencia';
import { elegirConMenosCarga, validarNombreTecnico } from '@/lib/reglas/tecnico';
import type { FilaCandidato, FilaTecnico, ResultadoActividad } from './tipos';

export function listarTecnicos(): Promise<FilaTecnico[]> {
  return consultar<FilaTecnico>(
    `SELECT t.id, t.nombre, t.activo,
            COUNT(i.id) FILTER (WHERE i.estado = 'en_revision') AS "enRevision",
            COUNT(i.id) FILTER (WHERE i.estado = 'cerrada') AS "cerradas"
       FROM tecnicos t
       LEFT JOIN incidencias i ON i.tecnico_id = t.id
      GROUP BY t.id, t.nombre, t.activo
      ORDER BY t.activo DESC, t.nombre`,
  );
}

export async function crearTecnico(nombre: string): Promise<{ id: string }> {
  validarNombreTecnico(nombre);
  const [tecnico] = await consultar<{ id: string }>(
    'INSERT INTO tecnicos (nombre) VALUES ($1) RETURNING id',
    [nombre.trim()],
  );
  return tecnico!;
}

// El índice único ux_tecnicos_nombre (sin distinguir mayúsculas) responde TECNICO_DUPLICADO.
export async function renombrarTecnico(id: string, nombre: string): Promise<void> {
  validarNombreTecnico(nombre);
  const filas = await consultar('UPDATE tecnicos SET nombre = $1 WHERE id = $2 RETURNING id', [
    nombre.trim(),
    id,
  ]);
  if (!filas.length) throw new ErrorDeNegocio('TECNICO_NO_ENCONTRADO');
}

export async function asignarTecnico(numeroCaso: string, tecnicoId: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const incidencia = await tx.query<{ estado: EstadoIncidencia }>(
      'SELECT estado FROM incidencias WHERE numero_caso = $1 FOR UPDATE',
      [numeroCaso],
    );
    const fila = incidencia.rows[0];
    if (!fila) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
    if (!puedeAsignarse(fila.estado)) throw new ErrorDeNegocio('INCIDENCIA_NO_ASIGNABLE'); // RN-11

    const tecnico = await tx.query('SELECT 1 FROM tecnicos WHERE id = $1 AND activo', [tecnicoId]);
    if (!tecnico.rowCount) throw new ErrorDeNegocio('TECNICO_NO_ENCONTRADO');

    await tx.query(
      `UPDATE incidencias SET estado = 'en_revision', tecnico_id = $1, fecha_estado = NOW()
        WHERE numero_caso = $2`,
      [tecnicoId, numeroCaso],
    );
  });
}

// Casos en revisión por técnico activo, en orden de nombre (desempate de elegirConMenosCarga).
async function cargaDeActivos(tx: PoolClient): Promise<Map<string, number>> {
  const { rows } = await tx.query<{ id: string; casos: number }>(
    `SELECT t.id, COUNT(i.id) AS casos
       FROM tecnicos t
       LEFT JOIN incidencias i ON i.tecnico_id = t.id AND i.estado = 'en_revision'
      WHERE t.activo
      GROUP BY t.id, t.nombre
      ORDER BY t.nombre`,
  );
  return new Map(rows.map((t) => [t.id, t.casos]));
}

// Pasa cada caso al técnico con menos carga (distinto del actual) y reinicia su fecha de estado.
async function repartir(
  tx: PoolClient,
  casos: { id: string; tecnico_id: string | null }[],
  carga: Map<string, number>,
): Promise<number> {
  let reasignadas = 0;
  for (const caso of casos) {
    const elegido = elegirConMenosCarga(carga, caso.tecnico_id);
    if (!elegido) continue; // No hay otro técnico activo: sigue con el actual.
    await tx.query('UPDATE incidencias SET tecnico_id = $1, fecha_estado = NOW() WHERE id = $2', [
      elegido,
      caso.id,
    ]);
    carga.set(elegido, (carga.get(elegido) ?? 0) + 1);
    if (caso.tecnico_id && carga.has(caso.tecnico_id)) {
      carga.set(caso.tecnico_id, carga.get(caso.tecnico_id)! - 1);
    }
    reasignadas += 1;
  }
  return reasignadas;
}

// RN-10: cada caso vencido pasa al técnico activo con menos casos en revisión, distinto del actual.
export async function reasignarIncidenciasVencidas(): Promise<{ reasignadas: number }> {
  return conTransaccion(async (tx) => {
    const { rows: enRevision } = await tx.query<{
      id: string;
      tecnico_id: string | null;
      dia_estado: string;
    }>(
      `SELECT id, tecnico_id, (fecha_estado AT TIME ZONE $1)::date AS dia_estado
         FROM incidencias WHERE estado = 'en_revision' FOR UPDATE`,
      [ZONA_HORARIA],
    );
    const hoy = hoyBogota();
    const vencidas = enRevision.filter((i) => diasEntre(i.dia_estado, hoy) > DIAS_REASIGNACION);
    if (!vencidas.length) return { reasignadas: 0 };
    return { reasignadas: await repartir(tx, vencidas, await cargaDeActivos(tx)) };
  });
}

// Activar o desactivar un técnico. Un técnico inactivo no recibe casos (asignarTecnico y RN-10
// solo eligen activos); al desactivarlo, sus casos en revisión pasan en la misma transacción a
// los activos con menos carga. Si no queda otro activo, los casos se quedan y se informa.
export async function cambiarActividadTecnico(
  id: string,
  activo: boolean,
): Promise<ResultadoActividad> {
  return conTransaccion(async (tx) => {
    const tecnico = await tx.query('SELECT 1 FROM tecnicos WHERE id = $1 FOR UPDATE', [id]);
    if (!tecnico.rowCount) throw new ErrorDeNegocio('TECNICO_NO_ENCONTRADO');
    await tx.query('UPDATE tecnicos SET activo = $1 WHERE id = $2', [activo, id]);
    if (activo) return { activo, reasignadas: 0, sinReasignar: 0 };

    const { rows: casos } = await tx.query<{ id: string; tecnico_id: string | null }>(
      `SELECT id, tecnico_id FROM incidencias
        WHERE tecnico_id = $1 AND estado = 'en_revision'
        ORDER BY created_at
        FOR UPDATE`,
      [id],
    );
    if (!casos.length) return { activo, reasignadas: 0, sinReasignar: 0 };
    const reasignadas = await repartir(tx, casos, await cargaDeActivos(tx));
    return { activo, reasignadas, sinReasignar: casos.length - reasignadas };
  });
}

// RN-09: la ventana empieza en una fecha calculada con hoyBogota() y se cuenta en la base con
// GROUP BY/HAVING; antes se traían todas las incidencias de la historia para contarlas aquí.
export async function listarCandidatosABaja(): Promise<FilaCandidato[]> {
  const filas = await consultar<FilaCandidato>(
    `SELECT e.codigo, s.nombre AS sala, e.estado,
            COUNT(*) AS "incidencias30d",
            MAX(i.fecha) AS "ultimaFecha",
            (SELECT COUNT(*) FROM incidencias p
              WHERE p.equipo_id = e.id AND p.estado <> 'cerrada') AS "pendientes"
       FROM equipos e
       JOIN salas s ON s.id = e.sala_id
       JOIN incidencias i ON i.equipo_id = e.id AND i.fecha >= $1::date
      WHERE e.estado <> 'dado_de_baja'
      GROUP BY e.id, e.codigo, s.nombre, e.estado
     HAVING COUNT(*) >= $2
      ORDER BY COUNT(*) DESC, e.codigo`,
    [inicioVentana(hoyBogota(), DIAS_VENTANA_ALERTA), INCIDENCIAS_PARA_ALERTA],
  );
  // La regla sigue en un solo lugar (lib/reglas/alertas.ts); HAVING solo evita traer filas de más.
  return filas.filter((f) => esCandidatoABaja(f.incidencias30d));
}
