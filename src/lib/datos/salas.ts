import type { PoolClient } from 'pg';
import { consultar } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
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
  const limpio = nombre.trim();
  if (!limpio) throw new ErrorDeNegocio('DATOS_INVALIDOS');
  const [sala] = await consultar<{ id: string }>(
    'INSERT INTO salas (nombre) VALUES ($1) RETURNING id',
    [limpio],
  );
  return sala!;
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
