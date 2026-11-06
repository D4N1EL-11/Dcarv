import { actorActual } from '@/lib/auth/contexto';
import { conTransaccion, consultar, crearParametros } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';
import {
  compararPlanes,
  estadoMantenimiento,
  proximoMantenimiento,
  validarFechaMantenimiento,
  validarFrecuencia,
  validarNotasMantenimiento,
  type EstadoMantenimiento,
} from '@/lib/reglas/mantenimiento';
import { ACTOR_SISTEMA, registrarEvento } from './eventos';

// Mantenimiento preventivo por sala (M11). La regla (cuándo toca y si está vencido) vive en
// lib/reglas/mantenimiento.ts; aquí solo se lee y se guarda.

export type FilaPlanMantenimiento = {
  salaId: string;
  sala: string;
  totalEquipos: number;
  cadaDias: number | null;
  desde: string | null;
  ultimo: string | null;
  ultimasNotas: string | null;
  realizados: number;
  proximo: string | null;
  estado: EstadoMantenimiento;
};

export type FilaMantenimiento = {
  id: number;
  salaId: string;
  sala: string;
  fecha: string;
  notas: string;
  registradoPor: string;
};

export type ConteoMantenimiento = Record<EstadoMantenimiento, number>;

// Una fila por sala con su plan, el último mantenimiento y el estado calculado para hoy (Bogotá).
export async function planDeMantenimiento(hoy = hoyBogota()): Promise<FilaPlanMantenimiento[]> {
  const filas = await consultar<Omit<FilaPlanMantenimiento, 'proximo' | 'estado'>>(
    `SELECT s.id AS "salaId", s.nombre AS sala,
            (SELECT COUNT(*) FROM equipos e WHERE e.sala_id = s.id AND e.estado <> 'dado_de_baja') AS "totalEquipos",
            s.mantenimiento_cada_dias AS "cadaDias", s.mantenimiento_desde AS desde,
            u.fecha AS ultimo, u.notas AS "ultimasNotas",
            (SELECT COUNT(*) FROM mantenimientos m WHERE m.sala_id = s.id) AS realizados
       FROM salas s
       LEFT JOIN LATERAL (
         SELECT m.fecha, m.notas FROM mantenimientos m
          WHERE m.sala_id = s.id ORDER BY m.fecha DESC, m.id DESC LIMIT 1
       ) u ON true`,
  );
  return filas
    .map((f) => {
      const plan = { cadaDias: f.cadaDias, desde: f.desde, ultimo: f.ultimo };
      return { ...f, proximo: proximoMantenimiento(plan), estado: estadoMantenimiento(plan, hoy) };
    })
    .sort((a, b) => compararPlanes({ ...a, nombre: a.sala }, { ...b, nombre: b.sala }));
}

export function contarPorEstado(planes: FilaPlanMantenimiento[]): ConteoMantenimiento {
  const conteo: ConteoMantenimiento = { vencido: 0, proximo: 0, al_dia: 0, sin_plan: 0 };
  for (const plan of planes) conteo[plan.estado] += 1;
  return conteo;
}

export function historialMantenimientos(
  filtros: { salaId?: string | undefined; desde?: string | undefined; hasta?: string | undefined } = {},
  limite = 30,
): Promise<FilaMantenimiento[]> {
  const condiciones: string[] = [];
  const { valores, p } = crearParametros();
  if (filtros.salaId) condiciones.push(`m.sala_id = ${p(filtros.salaId)}`);
  if (filtros.desde) condiciones.push(`m.fecha >= ${p(filtros.desde)}::date`);
  if (filtros.hasta) condiciones.push(`m.fecha <= ${p(filtros.hasta)}::date`);
  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return consultar<FilaMantenimiento>(
    `SELECT m.id, m.sala_id AS "salaId", s.nombre AS sala, m.fecha, m.notas, m.registrado_por AS "registradoPor"
       FROM mantenimientos m JOIN salas s ON s.id = m.sala_id
      ${donde}
      ORDER BY m.fecha DESC, m.id DESC
      LIMIT ${p(limite)}`,
    valores,
  );
}

// Programar (cadaDias) o quitar el plan (null). Al programar por primera vez o cambiar la
// frecuencia, la cuenta empieza hoy si la sala aún no tiene mantenimientos registrados.
export async function programarMantenimiento(salaId: string, cadaDias: number | null): Promise<void> {
  const dias = cadaDias === null ? null : validarFrecuencia(cadaDias);
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ nombre: string; cada: number | null }>(
      'SELECT nombre, mantenimiento_cada_dias AS cada FROM salas WHERE id = $1 FOR UPDATE',
      [salaId],
    );
    const sala = rows[0];
    if (!sala) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
    if (sala.cada === dias) return;
    await tx.query(
      `UPDATE salas
          SET mantenimiento_cada_dias = $1,
              mantenimiento_desde = CASE WHEN $1::int IS NULL THEN NULL ELSE COALESCE(mantenimiento_desde, $2::date) END
        WHERE id = $3`,
      [dias, hoyBogota(), salaId],
    );
    await registrarEvento(tx, {
      accion: 'mantenimiento_programado',
      detalle: dias === null ? `${sala.nombre}: sin plan` : `${sala.nombre}: cada ${dias} días`,
    });
  });
}

export async function registrarMantenimiento(salaId: string, fecha: string, notas: string): Promise<{ id: number }> {
  const dia = validarFechaMantenimiento(fecha, hoyBogota());
  const texto = validarNotasMantenimiento(notas);
  return conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ nombre: string }>('SELECT nombre FROM salas WHERE id = $1 FOR UPDATE', [salaId]);
    const sala = rows[0];
    if (!sala) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
    const insertado = await tx.query<{ id: number }>(
      'INSERT INTO mantenimientos (sala_id, fecha, notas, registrado_por) VALUES ($1, $2, $3, $4) RETURNING id',
      [salaId, dia, texto, actorActual()?.email ?? ACTOR_SISTEMA],
    );
    await registrarEvento(tx, {
      accion: 'mantenimiento_realizado',
      detalle: `${sala.nombre} (${dia})${texto ? `: ${texto}` : ''}`,
    });
    return insertado.rows[0]!;
  });
}
