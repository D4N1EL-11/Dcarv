import { actorActual } from '@/lib/auth/contexto';
import { LARGO_MAXIMO_ARTICULO } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { consultaWebsearch } from '@/lib/reglas/busqueda';
import type { CategoriaIncidencia } from '@/lib/reglas/clasificacion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { ACTOR_SISTEMA, registrarEvento } from './eventos';

// Base de conocimiento (M17): guías de solución. Soporte las escribe; cualquiera las lee y vota.

export type Articulo = {
  id: string;
  titulo: string;
  categoria: CategoriaIncidencia;
  contenido: string;
  palabrasClave: string;
  autor: string;
  utilSi: number;
  utilNo: number;
  actualizadoEn: string; // ISO 8601 en UTC
};

export type DatosArticulo = { titulo: string; categoria: CategoriaIncidencia; contenido: string; palabrasClave: string };

const COLUMNAS = `a.id, a.titulo, a.categoria, a.contenido, a.palabras_clave AS "palabrasClave", a.autor,
  a.util_si AS "utilSi", a.util_no AS "utilNo",
  to_char(a.actualizado_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "actualizadoEn"`;

const DOCUMENTO = `(setweight(to_tsvector('spanish', a.titulo), 'A')
  || setweight(to_tsvector('spanish', a.palabras_clave), 'B')
  || setweight(to_tsvector('spanish', a.contenido), 'C'))`;

function validar(d: DatosArticulo): DatosArticulo {
  const titulo = d.titulo.trim();
  const contenido = d.contenido.trim();
  if (titulo.length < 5 || titulo.length > 120) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El título debe tener entre 5 y 120 caracteres.');
  }
  if (contenido.length < 20 || contenido.length > LARGO_MAXIMO_ARTICULO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `El contenido debe tener entre 20 y ${LARGO_MAXIMO_ARTICULO} caracteres.`);
  }
  return { ...d, titulo, contenido, palabrasClave: d.palabrasClave.trim().slice(0, 200) };
}

// Con texto: las más parecidas primero (búsqueda en español). Sin texto: las más útiles.
export async function buscarArticulos(texto: string, limite = 50): Promise<Articulo[]> {
  const consulta = consultaWebsearch(texto);
  if (!consulta) {
    return consultar<Articulo>(
      `SELECT ${COLUMNAS} FROM articulos a ORDER BY (a.util_si - a.util_no) DESC, a.actualizado_en DESC LIMIT $1`,
      [limite],
    );
  }
  return consultar<Articulo>(
    `SELECT ${COLUMNAS} FROM articulos a
      WHERE ${DOCUMENTO} @@ websearch_to_tsquery('spanish', $1)
      ORDER BY ts_rank(${DOCUMENTO}, websearch_to_tsquery('spanish', $1)) DESC, (a.util_si - a.util_no) DESC
      LIMIT $2`,
    [consulta, limite],
  );
}

export async function obtenerArticulo(id: string): Promise<Articulo> {
  const [fila] = await consultar<Articulo>(`SELECT ${COLUMNAS} FROM articulos a WHERE a.id = $1`, [id]);
  if (!fila) throw new ErrorDeNegocio('ARTICULO_NO_ENCONTRADO');
  return fila;
}

export async function crearArticulo(d: DatosArticulo): Promise<{ id: string }> {
  const datos = validar(d);
  return conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO articulos (titulo, categoria, contenido, palabras_clave, autor) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [datos.titulo, datos.categoria, datos.contenido, datos.palabrasClave, actorActual()?.email ?? ACTOR_SISTEMA],
    );
    await registrarEvento(tx, { accion: 'articulo_publicado', detalle: datos.titulo });
    return rows[0]!;
  });
}

export async function editarArticulo(id: string, d: DatosArticulo): Promise<void> {
  const datos = validar(d);
  await conTransaccion(async (tx) => {
    const { rowCount } = await tx.query(
      'UPDATE articulos SET titulo = $2, categoria = $3, contenido = $4, palabras_clave = $5 WHERE id = $1',
      [id, datos.titulo, datos.categoria, datos.contenido, datos.palabrasClave],
    );
    if (!rowCount) throw new ErrorDeNegocio('ARTICULO_NO_ENCONTRADO');
    await registrarEvento(tx, { accion: 'articulo_editado', detalle: datos.titulo });
  });
}

export async function eliminarArticulo(id: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ titulo: string }>('DELETE FROM articulos WHERE id = $1 RETURNING titulo', [id]);
    if (!rows[0]) throw new ErrorDeNegocio('ARTICULO_NO_ENCONTRADO');
    await registrarEvento(tx, { accion: 'articulo_eliminado', detalle: rows[0].titulo });
  });
}

// "¿Le sirvió?". No se guarda quién votó: es una señal para ordenar, no una encuesta.
export async function votarArticulo(id: string, util: boolean): Promise<void> {
  const columna = util ? 'util_si' : 'util_no';
  const filas = await consultar(`UPDATE articulos SET ${columna} = ${columna} + 1 WHERE id = $1 RETURNING id`, [id]);
  if (!filas.length) throw new ErrorDeNegocio('ARTICULO_NO_ENCONTRADO');
}

export type CasoSimilar = {
  numeroCaso: string;
  equipo: string;
  categoria: CategoriaIncidencia;
  descripcion: string;
  solucion: string;
};

// Casos cerrados con nota de solución parecidos a una descripción (para el asistente con IA).
export async function casosSimilares(texto: string, limite: number, excluir?: string): Promise<CasoSimilar[]> {
  const consulta = consultaWebsearch(texto);
  if (!consulta) return [];
  return consultar<CasoSimilar>(
    `SELECT i.numero_caso AS "numeroCaso", e.codigo AS equipo, i.categoria, i.descripcion, c.texto AS solucion
       FROM incidencias i
       JOIN equipos e ON e.id = i.equipo_id
       JOIN comentarios c ON c.incidencia_id = i.id AND c.tipo = 'cierre'
      WHERE i.estado = 'cerrada'
        AND to_tsvector('spanish', i.descripcion) @@ websearch_to_tsquery('spanish', $1)
        AND ($3::text IS NULL OR i.numero_caso <> $3)
      ORDER BY ts_rank(to_tsvector('spanish', i.descripcion), websearch_to_tsquery('spanish', $1)) DESC, i.created_at DESC
      LIMIT $2`,
    [consulta, limite, excluir ?? null],
  );
}
