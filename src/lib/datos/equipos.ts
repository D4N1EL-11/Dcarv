import type { PoolClient } from 'pg';
import { LIMITE_LISTADO } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import {
  esEstadoEquipoValido,
  normalizarCodigo,
  validarDatosEquipo,
  type EstadoEquipo,
} from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { consultarHistorial } from './incidencias';
import { obtenerSalaActiva } from './salas';
import type { DetalleEquipo, FilaEquipo } from './tipos';

const COLUMNAS = `codigo, sala_id AS "salaId", sala_nombre AS sala, estado, incidencias_30d AS "incidencias30d"`;

export function listarEquipos(
  f: { salaId?: string | undefined; estado?: EstadoEquipo | undefined; busqueda?: string | undefined } = {},
): Promise<FilaEquipo[]> {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  const filtrar = (condicion: string, valor: unknown) => {
    valores.push(valor);
    condiciones.push(condicion.replace('?', `$${valores.length}`));
  };

  if (f.salaId) filtrar('sala_id = ?', f.salaId);
  if (f.estado) filtrar('estado = ?', f.estado);
  const busqueda = f.busqueda ? normalizarCodigo(f.busqueda) : '';
  if (busqueda) filtrar(`codigo ILIKE ? ESCAPE '\\'`, `%${busqueda.replace(/[\\%_]/g, '\\$&')}%`);

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar<FilaEquipo>(
    `SELECT ${COLUMNAS} FROM v_equipos ${donde} ORDER BY codigo LIMIT ${LIMITE_LISTADO}`,
    valores,
  );
}

export async function crearEquipo(d: {
  codigo: string;
  salaId: string;
}): Promise<{ id: string; codigo: string }> {
  validarDatosEquipo({ codigo: d.codigo, sala: d.salaId });
  return conTransaccion(async (tx) => {
    await obtenerSalaActiva(tx, d.salaId);
    const { rows } = await tx.query<{ id: string; codigo: string }>(
      'INSERT INTO equipos (codigo, sala_id) VALUES ($1, $2) RETURNING id, codigo', // RN-02
      [normalizarCodigo(d.codigo), d.salaId],
    );
    return rows[0]!;
  });
}

export async function obtenerEquipo(codigo: string): Promise<DetalleEquipo> {
  const limpio = normalizarCodigo(codigo);
  const [equipo] = await consultar<FilaEquipo>(
    `SELECT ${COLUMNAS} FROM v_equipos WHERE codigo = $1`,
    [limpio],
  );
  if (!equipo) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  return { equipo, historial: await consultarHistorial(limpio) };
}

export async function cambiarEstadoEquipo(codigo: string, estado: string): Promise<void> {
  if (!esEstadoEquipoValido(estado)) throw new ErrorDeNegocio('ESTADO_INVALIDO');
  const filas = await consultar('UPDATE equipos SET estado = $1 WHERE codigo = $2 RETURNING id', [
    estado,
    normalizarCodigo(codigo),
  ]);
  if (!filas.length) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
}

// FOR UPDATE: un cambio de estado simultáneo espera a que termine el reporte.
export async function obtenerEquipoPorCodigo(
  tx: PoolClient,
  codigo: string,
): Promise<{ id: string; estado: EstadoEquipo }> {
  const { rows } = await tx.query<{ id: string; estado: EstadoEquipo }>(
    'SELECT id, estado FROM equipos WHERE codigo = $1 FOR UPDATE',
    [normalizarCodigo(codigo)],
  );
  if (!rows[0]) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  return rows[0];
}
