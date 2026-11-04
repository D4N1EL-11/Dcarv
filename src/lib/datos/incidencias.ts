import { LIMITE_LISTADO } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { normalizarCodigo } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';
import { validarDescripcion, type EstadoIncidencia } from '@/lib/reglas/incidencia';
import { obtenerEquipoPorCodigo } from './equipos';
import type { ConteoIncidencias, FilaIncidencia, ResultadoIncidencia } from './tipos';

const SELECCION = `
  SELECT i.numero_caso AS "numeroCaso", e.codigo AS "equipoCodigo", i.descripcion, i.estado,
         i.fecha, t.nombre AS tecnico
    FROM incidencias i
    JOIN equipos e ON e.id = i.equipo_id
    LEFT JOIN tecnicos t ON t.id = i.tecnico_id`;

// Empate en created_at dentro de la misma transacción: decide el número de caso.
const ORDEN_RECIENTE = 'ORDER BY i.created_at DESC, i.numero_caso DESC'; // RN-14

export async function reportarIncidencia(
  codigoEquipo: string,
  descripcion: string,
): Promise<ResultadoIncidencia> {
  validarDescripcion(descripcion);
  return conTransaccion(async (tx) => {
    const equipo = await obtenerEquipoPorCodigo(tx, codigoEquipo);
    const { rows } = await tx.query<{ numero_caso: string }>(
      `INSERT INTO incidencias (numero_caso, equipo_id, descripcion, estado, fecha)
       VALUES ('INC-' || LPAD(nextval('seq_numero_caso')::text, 4, '0'), $1, $2, 'abierta', $3)
       RETURNING numero_caso`,
      [equipo.id, descripcion.trim(), hoyBogota()],
    );
    let estadoEquipo = equipo.estado;
    if (equipo.estado !== 'dado_de_baja') {
      await tx.query(`UPDATE equipos SET estado = 'en_reparacion' WHERE id = $1`, [equipo.id]); // RN-06
      estadoEquipo = 'en_reparacion';
    }
    const incidencia = await tx.query<FilaIncidencia>(`${SELECCION} WHERE i.numero_caso = $1`, [
      rows[0]!.numero_caso,
    ]);
    return { incidencia: incidencia.rows[0]!, estadoEquipo };
  });
}

// Interna: para quien ya comprobó que el equipo existe.
export function consultarHistorial(codigo: string): Promise<FilaIncidencia[]> {
  return consultar<FilaIncidencia>(`${SELECCION} WHERE e.codigo = $1 ${ORDEN_RECIENTE}`, [codigo]);
}

export async function historialDeEquipo(codigo: string): Promise<FilaIncidencia[]> {
  const limpio = normalizarCodigo(codigo);
  const existe = await consultar('SELECT 1 FROM equipos WHERE codigo = $1', [limpio]);
  if (!existe.length) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  return consultarHistorial(limpio);
}

export function listarIncidencias(
  f: { estado?: EstadoIncidencia | undefined; equipoCodigo?: string | undefined } = {},
): Promise<FilaIncidencia[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  if (f.estado) {
    valores.push(f.estado);
    condiciones.push(`i.estado = $${valores.length}`);
  }
  if (f.equipoCodigo) {
    valores.push(normalizarCodigo(f.equipoCodigo));
    condiciones.push(`e.codigo = $${valores.length}`);
  }
  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar<FilaIncidencia>(
    `${SELECCION} ${donde} ${ORDEN_RECIENTE} LIMIT ${LIMITE_LISTADO}`,
    valores,
  );
}

export async function contarIncidenciasPorEstado(): Promise<ConteoIncidencias> {
  const filas = await consultar<{ estado: EstadoIncidencia; total: number }>(
    'SELECT estado, COUNT(*) AS total FROM incidencias GROUP BY estado',
  );
  const conteo: ConteoIncidencias = { abierta: 0, en_revision: 0, cerrada: 0 };
  for (const { estado, total } of filas) conteo[estado] = total;
  return conteo;
}

export async function cerrarIncidencia(numeroCaso: string): Promise<void> {
  const [incidencia] = await consultar<{ estado: EstadoIncidencia }>(
    'SELECT estado FROM incidencias WHERE numero_caso = $1',
    [numeroCaso],
  );
  if (!incidencia) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
  await consultar(
    `UPDATE incidencias SET estado = 'cerrada', fecha_estado = NOW()
      WHERE numero_caso = $1 AND estado <> 'cerrada'`,
    [numeroCaso],
  );
}
