import type { PoolClient } from 'pg';
import { actorActual } from '@/lib/auth/contexto';
import { consultar, crearParametros } from '@/lib/db/conexion';

// Registro de cambios: quién hizo qué y cuándo. Se escribe con la misma transacción (tx) del
// cambio: si el cambio se revierte, su evento también. El actor sale del contexto de la petición
// (lib/auth/contexto.ts); sin petición (cron, scripts) queda 'sistema'.

export type AccionEvento =
  | 'incidencia_reportada'
  | 'incidencia_asignada'
  | 'incidencia_reasignada'
  | 'incidencia_cerrada'
  | 'foto_agregada'
  | 'estado_equipo'
  | 'equipo_registrado'
  | 'equipo_trasladado'
  | 'sala_registrada'
  | 'sala_renombrada'
  | 'sala_eliminada'
  | 'tecnico_registrado'
  | 'tecnico_renombrado'
  | 'tecnico_activado'
  | 'tecnico_desactivado'
  | 'rol_cambiado'
  | 'incidencia_clasificada'
  | 'solicitud_soporte'
  | 'solicitud_aprobada'
  | 'solicitud_rechazada'
  | 'mantenimiento_programado'
  | 'mantenimiento_realizado'
  | 'equipo_movido'
  | 'repuesto_registrado'
  | 'repuesto_entrada'
  | 'repuesto_usado'
  | 'hoja_de_vida'
  | 'caso_calificado'
  | 'articulo_publicado'
  | 'articulo_editado'
  | 'articulo_eliminado';

export type FilaEvento = {
  id: number;
  momento: string; // ISO 8601 en UTC
  actor: string;
  accion: AccionEvento;
  equipoCodigo: string | null;
  numeroCaso: string | null;
  detalle: string;
};

type NuevoEvento = {
  accion: AccionEvento;
  equipoCodigo?: string | null | undefined;
  numeroCaso?: string | null | undefined;
  detalle?: string | undefined;
};

export const ACTOR_SISTEMA = 'sistema';

export async function registrarEvento(tx: PoolClient, evento: NuevoEvento): Promise<void> {
  await tx.query(
    'INSERT INTO eventos (actor, accion, equipo_codigo, numero_caso, detalle) VALUES ($1, $2, $3, $4, $5)',
    [
      actorActual()?.email ?? ACTOR_SISTEMA,
      evento.accion,
      evento.equipoCodigo ?? null,
      evento.numeroCaso ?? null,
      (evento.detalle ?? '').slice(0, 300),
    ],
  );
}

const COLUMNAS = `id, actor, accion, equipo_codigo AS "equipoCodigo", numero_caso AS "numeroCaso", detalle,
  to_char(momento AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS momento`;

export function eventosDeEquipo(codigo: string, limite = 50): Promise<FilaEvento[]> {
  return consultar<FilaEvento>(
    `SELECT ${COLUMNAS} FROM eventos WHERE equipo_codigo = $1 ORDER BY momento DESC, id DESC LIMIT $2`,
    [codigo, limite],
  );
}

// Recorrido de un caso (ficha del caso), del más antiguo al más reciente.
export function eventosDeCaso(numeroCaso: string, limite = 50): Promise<FilaEvento[]> {
  return consultar<FilaEvento>(
    `SELECT ${COLUMNAS} FROM eventos WHERE numero_caso = $1 ORDER BY momento, id LIMIT $2`,
    [numeroCaso, limite],
  );
}

export type FiltrosEventos = { actor?: string | undefined; equipoCodigo?: string | undefined; antesDe?: number | undefined };

// Registro completo, del más reciente al más antiguo. antesDe (id) pagina hacia atrás.
export function eventosRecientes(filtros: FiltrosEventos = {}, limite = 50): Promise<FilaEvento[]> {
  const { valores, p } = crearParametros();
  const condiciones: string[] = [];
  if (filtros.actor) condiciones.push(`actor = ${p(filtros.actor)}`);
  if (filtros.equipoCodigo) condiciones.push(`equipo_codigo = ${p(filtros.equipoCodigo)}`);
  if (filtros.antesDe) condiciones.push(`id < ${p(filtros.antesDe)}`);
  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar<FilaEvento>(
    `SELECT ${COLUMNAS} FROM eventos ${donde} ORDER BY id DESC LIMIT ${p(limite)}`,
    valores,
  );
}

export async function actoresDeEventos(): Promise<string[]> {
  const filas = await consultar<{ actor: string }>('SELECT DISTINCT actor FROM eventos ORDER BY actor');
  return filas.map((f) => f.actor);
}
