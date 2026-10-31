import { DIAS_REASIGNACION, DIAS_VENTANA_ALERTA, ZONA_HORARIA } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { esCandidatoABaja } from '@/lib/reglas/alertas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { dentroDeVentana, diasEntre, hoyBogota } from '@/lib/reglas/fechas';
import { puedeAsignarse, type EstadoIncidencia } from '@/lib/reglas/incidencia';
import type { FilaCandidato, FilaTecnico } from './tipos';

export function listarTecnicos(): Promise<FilaTecnico[]> {
  return consultar<FilaTecnico>(
    `SELECT t.id, t.nombre, t.activo,
            COUNT(i.id) FILTER (WHERE i.estado = 'en_revision') AS "enRevision"
       FROM tecnicos t
       LEFT JOIN incidencias i ON i.tecnico_id = t.id
      GROUP BY t.id, t.nombre, t.activo
      ORDER BY t.nombre`,
  );
}

export async function crearTecnico(nombre: string): Promise<{ id: string }> {
  const [tecnico] = await consultar<{ id: string }>(
    'INSERT INTO tecnicos (nombre) VALUES ($1) RETURNING id',
    [nombre.trim()],
  );
  return tecnico!;
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

    const { rows: activos } = await tx.query<{ id: string }>(
      'SELECT id FROM tecnicos WHERE activo ORDER BY nombre',
    );
    const carga = new Map(activos.map((t) => [t.id, 0]));
    for (const { tecnico_id } of enRevision) {
      if (tecnico_id && carga.has(tecnico_id)) carga.set(tecnico_id, carga.get(tecnico_id)! + 1);
    }

    let reasignadas = 0;
    for (const incidencia of vencidas) {
      const [elegido] = [...carga]
        .filter(([id]) => id !== incidencia.tecnico_id)
        .sort((a, b) => a[1] - b[1]);
      if (!elegido) continue; // No hay otro técnico activo: sigue con el actual.
      await tx.query('UPDATE incidencias SET tecnico_id = $1, fecha_estado = NOW() WHERE id = $2', [
        elegido[0],
        incidencia.id,
      ]);
      carga.set(elegido[0], elegido[1] + 1);
      if (incidencia.tecnico_id && carga.has(incidencia.tecnico_id)) {
        carga.set(incidencia.tecnico_id, carga.get(incidencia.tecnico_id)! - 1);
      }
      reasignadas += 1;
    }
    return { reasignadas };
  });
}

// RN-09: se recuenta con hoyBogota(); el conteo de v_equipos depende de la zona de la base.
export async function listarCandidatosABaja(): Promise<FilaCandidato[]> {
  const filas = await consultar<{ codigo: string; sala: string; fecha: string }>(
    `SELECT e.codigo, s.nombre AS sala, i.fecha
       FROM equipos e
       JOIN salas s ON s.id = e.sala_id
       JOIN incidencias i ON i.equipo_id = e.id
      WHERE e.estado <> 'dado_de_baja'
      ORDER BY e.codigo`,
  );
  const hoy = hoyBogota();
  const porEquipo = new Map<string, FilaCandidato>();
  for (const { codigo, sala, fecha } of filas) {
    if (!dentroDeVentana(fecha, hoy, DIAS_VENTANA_ALERTA)) continue;
    const fila = porEquipo.get(codigo) ?? { codigo, sala, incidencias30d: 0 };
    fila.incidencias30d += 1;
    porEquipo.set(codigo, fila);
  }
  return [...porEquipo.values()].filter((f) => esCandidatoABaja(f.incidencias30d));
}
