import type { PoolClient } from 'pg';
import { actorActual } from '@/lib/auth/contexto';
import { consultar, crearParametros, despuesDeConfirmar } from '@/lib/db/conexion';
import type { NuevoAviso, TipoAviso } from '@/lib/reglas/avisos';
import { programarPush } from './push';

// Avisos de la campana (M9). Se escriben con la transacción (tx) del cambio que los origina: si el
// cambio se revierte, el aviso también. Nadie recibe aviso de lo que hizo él mismo.

export type FilaAviso = {
  id: number;
  tipo: TipoAviso;
  titulo: string;
  detalle: string;
  enlace: string;
  momento: string; // ISO 8601 en UTC
  leido: boolean;
};

const COLUMNAS = `id, tipo, titulo, detalle, enlace, (leido_en IS NOT NULL) AS leido,
  to_char(creado_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS momento`;

function insertarPara(destinatarios: string, aviso: NuevoAviso, extra: unknown[]): [string, unknown[]] {
  return [
    `INSERT INTO avisos (usuario_id, tipo, titulo, detalle, enlace)
     SELECT u.id, $1, $2, $3, $4 FROM public.users u WHERE ${destinatarios}
     RETURNING usuario_id`,
    [aviso.tipo, aviso.titulo, aviso.detalle, aviso.enlace, ...extra],
  ];
}

// Guarda el aviso y, cuando la transacción se confirme, lo envía como push (lib/datos/push.ts).
async function insertar(tx: PoolClient, destinatarios: string, aviso: NuevoAviso, extra: unknown[]): Promise<void> {
  const { rows } = await tx.query<{ usuario_id: string }>(...insertarPara(destinatarios, aviso, extra));
  const ids = rows.map((fila) => fila.usuario_id);
  if (ids.length) despuesDeConfirmar(tx, () => programarPush(ids, aviso));
}

// A una cuenta concreta (por ejemplo, quien reportó el caso). Sin destinatario o si es quien
// actúa, no se escribe nada.
export async function avisarA(tx: PoolClient, usuarioId: string | null | undefined, aviso: NuevoAviso): Promise<void> {
  if (!usuarioId || usuarioId === actorActual()?.id) return;
  await insertar(tx, 'u.id = $5', aviso, [usuarioId]);
}

// A todo el equipo de soporte (administradores y soporte técnico), menos quien actúa.
export async function avisarASoporte(tx: PoolClient, aviso: NuevoAviso): Promise<void> {
  const actor = actorActual()?.id ?? null;
  await insertar(tx, `u.role IN ('admin', 'editor') AND ($5::uuid IS NULL OR u.id <> $5::uuid)`, aviso, [actor]);
}

// Solo a los administradores (solicitudes de acceso de soporte).
export async function avisarAAdministradores(tx: PoolClient, aviso: NuevoAviso): Promise<void> {
  const actor = actorActual()?.id ?? null;
  await insertar(tx, `u.role = 'admin' AND ($5::uuid IS NULL OR u.id <> $5::uuid)`, aviso, [actor]);
}

export type ResumenAvisos = { sinLeer: number; avisos: FilaAviso[] };

// Los más recientes de una cuenta. antesDe (id) pagina hacia atrás; soloSinLeer filtra.
export async function avisosDe(
  usuarioId: string,
  opciones: { limite: number; antesDe?: number | undefined; soloSinLeer?: boolean | undefined },
): Promise<ResumenAvisos> {
  const { valores, p } = crearParametros();
  const condiciones = [`usuario_id = ${p(usuarioId)}`];
  if (opciones.antesDe) condiciones.push(`id < ${p(opciones.antesDe)}`);
  if (opciones.soloSinLeer) condiciones.push('leido_en IS NULL');
  const [avisos, conteo] = await Promise.all([
    consultar<FilaAviso>(
      `SELECT ${COLUMNAS} FROM avisos WHERE ${condiciones.join(' AND ')} ORDER BY id DESC LIMIT ${p(opciones.limite)}`,
      valores,
    ),
    contarSinLeer(usuarioId),
  ]);
  return { sinLeer: conteo, avisos };
}

export async function contarSinLeer(usuarioId: string): Promise<number> {
  const [fila] = await consultar<{ total: number }>(
    'SELECT COUNT(*) AS total FROM avisos WHERE usuario_id = $1 AND leido_en IS NULL',
    [usuarioId],
  );
  return fila?.total ?? 0;
}

// Marca como leídos los avisos indicados (solo si son de esa cuenta) o, sin ids, todos.
export async function marcarAvisosLeidos(usuarioId: string, ids?: number[]): Promise<number> {
  if (ids && !ids.length) return 0;
  const filas = ids
    ? await consultar<{ id: number }>(
        'UPDATE avisos SET leido_en = now() WHERE usuario_id = $1 AND leido_en IS NULL AND id = ANY($2::bigint[]) RETURNING id',
        [usuarioId, ids],
      )
    : await consultar<{ id: number }>(
        'UPDATE avisos SET leido_en = now() WHERE usuario_id = $1 AND leido_en IS NULL RETURNING id',
        [usuarioId],
      );
  return filas.length;
}
