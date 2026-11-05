import { LIMITE_LISTADO, ZONA_HORARIA } from '@/lib/config/soporte';
import { conTransaccion, consultar, crearParametros } from '@/lib/db/conexion';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import { normalizarCodigo } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';
import {
  puedeReactivarseAlCerrar,
  validarDescripcion,
  type EstadoIncidencia,
} from '@/lib/reglas/incidencia';
import { desplazamiento } from '@/lib/reglas/paginacion';
import { obtenerEquipoPorCodigo } from './equipos';
import { aPagina } from './paginar';
import type {
  ConteoIncidencias,
  FilaIncidencia,
  Pagina,
  ResultadoCierre,
  ResultadoIncidencia,
} from './tipos';

export type FiltrosIncidencias = {
  estado?: EstadoIncidencia | undefined;
  equipoCodigo?: string | undefined;
  busqueda?: string | undefined;
  tecnicoId?: string | undefined;
};

function seleccion(p: (valor: unknown) => string, extra = ''): string {
  return `
  SELECT ${extra} i.numero_caso AS "numeroCaso", e.codigo AS "equipoCodigo", i.descripcion, i.estado,
         i.fecha, t.nombre AS tecnico, i.tecnico_id AS "tecnicoId",
         (i.fecha_estado AT TIME ZONE ${p(ZONA_HORARIA)})::date AS "diaEstado",
         e.estado AS "estadoEquipo",
         (SELECT COUNT(*) FROM incidencias o
           WHERE o.equipo_id = i.equipo_id AND o.id <> i.id AND o.estado <> 'cerrada') AS "otrasPendientes"
    FROM incidencias i
    JOIN equipos e ON e.id = i.equipo_id
    LEFT JOIN tecnicos t ON t.id = i.tecnico_id`;
}

// Empate en created_at dentro de la misma transacción: decide el número de caso.
const ORDEN_RECIENTE = 'ORDER BY i.created_at DESC, i.numero_caso DESC'; // RN-14

function escaparComodines(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, '\\$&')}%`;
}

// Condiciones comunes al listado y a los conteos por estado. El estado se omite a propósito
// en los conteos: cada pestaña cuenta "cuántas habría con este estado y los demás filtros".
function condiciones(f: Omit<FiltrosIncidencias, 'estado'>, p: (valor: unknown) => string): string[] {
  const lista: string[] = [];
  if (f.equipoCodigo) lista.push(`e.codigo = ${p(normalizarCodigo(f.equipoCodigo))}`);
  if (f.tecnicoId) lista.push(`i.tecnico_id = ${p(f.tecnicoId)}`);
  const busqueda = f.busqueda?.trim();
  if (busqueda) {
    const patron = p(escaparComodines(busqueda));
    lista.push(
      `(i.numero_caso ILIKE ${patron} ESCAPE '\\' OR e.codigo ILIKE ${patron} ESCAPE '\\' OR i.descripcion ILIKE ${patron} ESCAPE '\\')`,
    );
  }
  return lista;
}

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
    const { valores, p } = crearParametros();
    const sql = `${seleccion(p)} WHERE i.numero_caso = ${p(rows[0]!.numero_caso)}`;
    const incidencia = await tx.query<FilaIncidencia>(sql, valores);
    return { incidencia: incidencia.rows[0]!, estadoEquipo };
  });
}

// Interna: para quien ya comprobó que el equipo existe.
export function consultarHistorial(codigo: string): Promise<FilaIncidencia[]> {
  const { valores, p } = crearParametros();
  return consultar<FilaIncidencia>(
    `${seleccion(p)} WHERE e.codigo = ${p(codigo)} ${ORDEN_RECIENTE}`,
    valores,
  );
}

export async function historialDeEquipo(codigo: string): Promise<FilaIncidencia[]> {
  const limpio = normalizarCodigo(codigo);
  const existe = await consultar('SELECT 1 FROM equipos WHERE codigo = $1', [limpio]);
  if (!existe.length) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  return consultarHistorial(limpio);
}

export async function paginarIncidencias(
  f: FiltrosIncidencias,
  pagina: number,
  tamano: number,
): Promise<Pagina<FilaIncidencia>> {
  const { valores, p } = crearParametros();
  // COUNT(*) OVER () se calcula antes del LIMIT: trae el total de coincidencias en la misma consulta.
  const base = seleccion(p, 'COUNT(*) OVER () AS "totalFilas",');
  const lista = condiciones(f, p);
  if (f.estado) lista.push(`i.estado = ${p(f.estado)}`);
  const donde = lista.length ? `WHERE ${lista.join(' AND ')}` : '';
  const filas = await consultar<FilaIncidencia & { totalFilas: number }>(
    `${base} ${donde} ${ORDEN_RECIENTE}
     LIMIT ${p(tamano)} OFFSET ${p(desplazamiento(pagina, tamano))}`,
    valores,
  );
  return aPagina(filas, pagina, tamano);
}

// Listado sin paginar (API y scripts): conserva el tope de seguridad LIMITE_LISTADO.
export async function listarIncidencias(f: FiltrosIncidencias = {}): Promise<FilaIncidencia[]> {
  return (await paginarIncidencias(f, 1, LIMITE_LISTADO)).filas;
}

export async function contarIncidenciasPorEstado(
  f: Omit<FiltrosIncidencias, 'estado'> = {},
): Promise<ConteoIncidencias> {
  const { valores, p } = crearParametros();
  const lista = condiciones(f, p);
  const donde = lista.length ? `WHERE ${lista.join(' AND ')}` : '';
  const filas = await consultar<{ estado: EstadoIncidencia; total: number }>(
    `SELECT i.estado, COUNT(*) AS total
       FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
      ${donde}
      GROUP BY i.estado`,
    valores,
  );
  const conteo: ConteoIncidencias = { abierta: 0, en_revision: 0, cerrada: 0 };
  for (const { estado, total } of filas) conteo[estado] = total;
  return conteo;
}

// CU-07 en una sola transacción: la incidencia y su equipo quedan bloqueados mientras se decide.
// Con `equipoFuncional`, el equipo vuelve a "funcional" solo si estaba en reparación y ya no le
// quedan incidencias pendientes (puedeReactivarseAlCerrar). Cerrar una cerrada no cambia nada.
export async function cerrarIncidencia(
  numeroCaso: string,
  opciones: { equipoFuncional?: boolean | undefined } = {},
): Promise<ResultadoCierre> {
  return conTransaccion(async (tx) => {
    const { rows } = await tx.query<{
      id: string;
      estado: EstadoIncidencia;
      equipo_id: string;
      estado_equipo: EstadoEquipo;
    }>(
      `SELECT i.id, i.estado, i.equipo_id, e.estado AS estado_equipo
         FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
        WHERE i.numero_caso = $1
        FOR UPDATE OF i, e`,
      [numeroCaso],
    );
    const fila = rows[0];
    if (!fila) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');

    if (fila.estado !== 'cerrada') {
      await tx.query(
        `UPDATE incidencias SET estado = 'cerrada', fecha_estado = NOW() WHERE id = $1`,
        [fila.id],
      );
    }

    if (!opciones.equipoFuncional) return { estadoEquipo: fila.estado_equipo, equipoReactivado: false };

    const pendientes = await tx.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM incidencias WHERE equipo_id = $1 AND estado <> 'cerrada'`,
      [fila.equipo_id],
    );
    if (!puedeReactivarseAlCerrar(fila.estado_equipo, pendientes.rows[0]?.total ?? 0)) {
      return { estadoEquipo: fila.estado_equipo, equipoReactivado: false };
    }
    await tx.query(`UPDATE equipos SET estado = 'funcional' WHERE id = $1`, [fila.equipo_id]);
    return { estadoEquipo: 'funcional', equipoReactivado: true };
  });
}
