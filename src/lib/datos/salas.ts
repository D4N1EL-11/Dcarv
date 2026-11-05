import type { PoolClient } from 'pg';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { validarNombreSala } from '@/lib/reglas/sala';
import type { FilaSala } from './tipos';

export function listarSalas(): Promise<FilaSala[]> {
  return consultar<FilaSala>(
    `SELECT s.id, s.nombre,
            COUNT(e.id) AS "totalEquipos",
            COUNT(e.id) FILTER (WHERE e.estado = 'funcional') AS "funcionales",
            COUNT(e.id) FILTER (WHERE e.estado = 'en_reparacion') AS "enReparacion",
            COUNT(e.id) FILTER (WHERE e.estado = 'dado_de_baja') AS "dadosDeBaja"
       FROM salas s
       LEFT JOIN equipos e ON e.sala_id = s.id
      GROUP BY s.id, s.nombre
      ORDER BY s.nombre`,
  );
}

export async function crearSala(nombre: string): Promise<{ id: string }> {
  validarNombreSala(nombre);
  const [sala] = await consultar<{ id: string }>(
    'INSERT INTO salas (nombre) VALUES ($1) RETURNING id',
    [nombre.trim()],
  );
  return sala!;
}

// El índice único ux_salas_nombre (sin distinguir mayúsculas) responde SALA_DUPLICADA.
export async function renombrarSala(id: string, nombre: string): Promise<void> {
  validarNombreSala(nombre);
  const filas = await consultar('UPDATE salas SET nombre = $1 WHERE id = $2 RETURNING id', [
    nombre.trim(),
    id,
  ]);
  if (!filas.length) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
}

// Solo se elimina una sala sin equipos: los equipos no se borran (RN-15) y la llave foránea
// ON DELETE RESTRICT respalda esta comprobación si dos personas actúan a la vez.
export async function eliminarSala(id: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const sala = await tx.query('SELECT 1 FROM salas WHERE id = $1 FOR UPDATE', [id]);
    if (!sala.rowCount) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
    const { rows } = await tx.query<{ total: number }>(
      'SELECT COUNT(*) AS total FROM equipos WHERE sala_id = $1',
      [id],
    );
    const total = rows[0]?.total ?? 0;
    if (total > 0) {
      throw new ErrorDeNegocio(
        'TIENE_DEPENDENCIAS',
        `La sala tiene ${total} ${total === 1 ? 'equipo registrado' : 'equipos registrados'}; no se puede eliminar.`,
      );
    }
    await tx.query('DELETE FROM salas WHERE id = $1', [id]);
  });
}

export async function obtenerSalaActiva(
  tx: PoolClient,
  salaId: string,
): Promise<{ id: string; nombre: string }> {
  const { rows } = await tx.query<{ id: string; nombre: string }>(
    'SELECT id, nombre FROM salas WHERE id = $1',
    [salaId],
  );
  if (!rows[0]) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
  return rows[0];
}
