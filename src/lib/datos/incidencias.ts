import { DIAS_VENTANA_ALERTA, LIMITE_LISTADO, ZONA_HORARIA } from '@/lib/config/soporte';
import { conTransaccion, consultar, crearParametros } from '@/lib/db/conexion';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import { ETIQUETA_EQUIPO, normalizarCodigo } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, inicioVentana } from '@/lib/reglas/fechas';
import {
  puedeReactivarseAlCerrar,
  validarDescripcion,
  type EstadoIncidencia,
} from '@/lib/reglas/incidencia';
import { desplazamiento } from '@/lib/reglas/paginacion';
import { obtenerEquipoPorCodigo } from './equipos';
import { registrarEvento } from './eventos';
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
  salaId?: string | undefined;
  // Solo en el servidor ("Mis reportes"): id de la cuenta que reportó.
  reportadoPor?: string | undefined;
};

function seleccion(p: (valor: unknown) => string, extra = ''): string {
  return `
  SELECT ${extra} i.numero_caso AS "numeroCaso", e.codigo AS "equipoCodigo", i.descripcion, i.estado,
         i.fecha, t.nombre AS tecnico, i.tecnico_id AS "tecnicoId",
         (i.fecha_estado AT TIME ZONE ${p(ZONA_HORARIA)})::date AS "diaEstado",
         e.estado AS "estadoEquipo",
         u.email AS "reportadoPor", (i.foto IS NOT NULL) AS "tieneFoto",
         (SELECT COUNT(*) FROM incidencias o
           WHERE o.equipo_id = i.equipo_id AND o.id <> i.id AND o.estado <> 'cerrada') AS "otrasPendientes"
    FROM incidencias i
    JOIN equipos e ON e.id = i.equipo_id
    LEFT JOIN tecnicos t ON t.id = i.tecnico_id
    LEFT JOIN public.users u ON u.id = i.reportado_por`;
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
  // Sala actual del equipo: un equipo trasladado lleva su historial a la sala nueva.
  if (f.salaId) lista.push(`e.sala_id = ${p(f.salaId)}`);
  if (f.reportadoPor) lista.push(`i.reportado_por = ${p(f.reportadoPor)}`);
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
  opciones: { reportadoPor?: string | undefined } = {},
): Promise<ResultadoIncidencia> {
  validarDescripcion(descripcion);
  return conTransaccion(async (tx) => {
    const equipo = await obtenerEquipoPorCodigo(tx, codigoEquipo);
    const codigo = normalizarCodigo(codigoEquipo);
    const { rows } = await tx.query<{ numero_caso: string }>(
      `INSERT INTO incidencias (numero_caso, equipo_id, descripcion, estado, fecha, reportado_por)
       VALUES ('INC-' || LPAD(nextval('seq_numero_caso')::text, 4, '0'), $1, $2, 'abierta', $3, $4)
       RETURNING numero_caso`,
      [equipo.id, descripcion.trim(), hoyBogota(), opciones.reportadoPor ?? null],
    );
    const numeroCaso = rows[0]!.numero_caso;
    await registrarEvento(tx, { accion: 'incidencia_reportada', numeroCaso, equipoCodigo: codigo, detalle: descripcion.trim() });
    let estadoEquipo = equipo.estado;
    // RN-06; si ya estaba en reparación no hay cambio que anotar.
    if (equipo.estado !== 'dado_de_baja' && equipo.estado !== 'en_reparacion') {
      await tx.query(`UPDATE equipos SET estado = 'en_reparacion' WHERE id = $1`, [equipo.id]);
      await registrarEvento(tx, {
        accion: 'estado_equipo',
        equipoCodigo: codigo,
        numeroCaso,
        detalle: `${ETIQUETA_EQUIPO[equipo.estado]} → ${ETIQUETA_EQUIPO.en_reparacion} (automático al reportar)`,
      });
    }
    if (equipo.estado !== 'dado_de_baja') estadoEquipo = 'en_reparacion';
    const { valores, p } = crearParametros();
    const sql = `${seleccion(p)} WHERE i.numero_caso = ${p(numeroCaso)}`;
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

// "Requiere atención" del panel: lo pendiente (abierto o en revisión), de lo más antiguo a lo más
// reciente, porque lo que más espera es lo primero que hay que atender.
export async function incidenciasPendientes(limite: number): Promise<{ filas: FilaIncidencia[]; total: number }> {
  const { valores, p } = crearParametros();
  const filas = await consultar<FilaIncidencia & { totalFilas: number }>(
    `${seleccion(p, 'COUNT(*) OVER () AS "totalFilas",')}
      WHERE i.estado <> 'cerrada'
      ORDER BY i.fecha ASC, i.created_at ASC
      LIMIT ${p(limite)}`,
    valores,
  );
  const { filas: limpias, total } = aPagina(filas, 1, limite);
  return { filas: limpias, total };
}

export type ResumenCierres = {
  cerradas: number;
  promedioDias: number | null;
  pendienteMasAntigua: string | null;
};

// Con los mismos filtros del listado (salvo el estado): cierres de la ventana de 30 días (RN-09;
// el plan no pide estadísticas más largas), el promedio de días entre reporte y cierre (ambos en
// Bogotá) y la fecha de la incidencia pendiente más antigua.
export async function resumenCierres(f: Omit<FiltrosIncidencias, 'estado'> = {}): Promise<ResumenCierres> {
  const { valores, p } = crearParametros();
  const cierre = `(i.fecha_estado AT TIME ZONE ${p(ZONA_HORARIA)})::date`;
  const enVentana = `i.estado = 'cerrada' AND ${cierre} >= ${p(inicioVentana(hoyBogota(), DIAS_VENTANA_ALERTA))}::date`;
  const lista = condiciones(f, p);
  const donde = lista.length ? `WHERE ${lista.join(' AND ')}` : '';
  const filas = await consultar<ResumenCierres>(
    `SELECT COUNT(*) FILTER (WHERE ${enVentana}) AS cerradas,
            (AVG(${cierre} - i.fecha) FILTER (WHERE ${enVentana}))::float8 AS "promedioDias",
            MIN(i.fecha) FILTER (WHERE i.estado <> 'cerrada') AS "pendienteMasAntigua"
       FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
      ${donde}`,
    valores,
  );
  return filas[0] ?? { cerradas: 0, promedioDias: null, pendienteMasAntigua: null };
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
      equipo_codigo: string;
    }>(
      `SELECT i.id, i.estado, i.equipo_id, e.estado AS estado_equipo, e.codigo AS equipo_codigo
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
      await registrarEvento(tx, { accion: 'incidencia_cerrada', numeroCaso, equipoCodigo: fila.equipo_codigo });
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
    await registrarEvento(tx, {
      accion: 'estado_equipo',
      equipoCodigo: fila.equipo_codigo,
      numeroCaso,
      detalle: `${ETIQUETA_EQUIPO[fila.estado_equipo]} → ${ETIQUETA_EQUIPO.funcional} (al cerrar el caso)`,
    });
    return { estadoEquipo: 'funcional', equipoReactivado: true };
  });
}

// Fotos (lib/almacenamiento.ts guarda el archivo; aquí solo su ruta). reportadoPor es el id de
// la cuenta que reportó: una cuenta de reporte solo ve y agrega fotos en sus propios casos.
export type DatosFoto = { equipoCodigo: string; reportadoPor: string | null; foto: string | null };

export async function datosDeFoto(numeroCaso: string): Promise<DatosFoto> {
  const [fila] = await consultar<DatosFoto>(
    `SELECT e.codigo AS "equipoCodigo", i.reportado_por AS "reportadoPor", i.foto
       FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
      WHERE i.numero_caso = $1`,
    [numeroCaso],
  );
  if (!fila) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
  return fila;
}

export async function guardarFoto(numeroCaso: string, ruta: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ equipo_codigo: string }>(
      `UPDATE incidencias i SET foto = $1 FROM equipos e
        WHERE e.id = i.equipo_id AND i.numero_caso = $2
        RETURNING e.codigo AS equipo_codigo`,
      [ruta, numeroCaso],
    );
    if (!rows[0]) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
    await registrarEvento(tx, { accion: 'foto_agregada', numeroCaso, equipoCodigo: rows[0].equipo_codigo });
  });
}
