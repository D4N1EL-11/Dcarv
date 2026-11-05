import { consultar } from '@/lib/db/conexion';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';

export type ResultadosBusqueda = {
  equipos: { codigo: string; sala: string; estado: EstadoEquipo }[];
  incidencias: { numeroCaso: string; equipoCodigo: string; descripcion: string; estado: EstadoIncidencia }[];
  salas: { id: string; nombre: string; totalEquipos: number }[];
  tecnicos: { id: string; nombre: string; activo: boolean }[];
};

const POR_GRUPO = 5;

// Búsqueda del atajo Ctrl+K. Cuatro consultas en paralelo, cinco resultados por grupo; las
// coincidencias que empiezan por el texto van primero. Los comodines de ILIKE se escapan.
export async function buscarGlobal(texto: string): Promise<ResultadosBusqueda> {
  const limpio = texto.trim().replace(/[\\%_]/g, '\\$&');
  const contiene = `%${limpio}%`;
  const empieza = `${limpio}%`;
  const [equipos, incidencias, salas, tecnicos] = await Promise.all([
    consultar<ResultadosBusqueda['equipos'][number]>(
      `SELECT e.codigo, s.nombre AS sala, e.estado
         FROM equipos e JOIN salas s ON s.id = e.sala_id
        WHERE e.codigo ILIKE $1 ESCAPE '\\'
        ORDER BY (e.codigo ILIKE $2 ESCAPE '\\') DESC, e.codigo
        LIMIT ${POR_GRUPO}`,
      [contiene, empieza],
    ),
    consultar<ResultadosBusqueda['incidencias'][number]>(
      `SELECT i.numero_caso AS "numeroCaso", e.codigo AS "equipoCodigo",
              LEFT(i.descripcion, 120) AS descripcion, i.estado
         FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
        WHERE i.numero_caso ILIKE $1 ESCAPE '\\' OR i.descripcion ILIKE $1 ESCAPE '\\'
        ORDER BY (i.numero_caso ILIKE $2 ESCAPE '\\') DESC, i.created_at DESC
        LIMIT ${POR_GRUPO}`,
      [contiene, empieza],
    ),
    consultar<ResultadosBusqueda['salas'][number]>(
      `SELECT s.id, s.nombre, COUNT(e.id) AS "totalEquipos"
         FROM salas s LEFT JOIN equipos e ON e.sala_id = s.id
        WHERE s.nombre ILIKE $1 ESCAPE '\\'
        GROUP BY s.id, s.nombre
        ORDER BY (s.nombre ILIKE $2 ESCAPE '\\') DESC, s.nombre
        LIMIT ${POR_GRUPO}`,
      [contiene, empieza],
    ),
    consultar<ResultadosBusqueda['tecnicos'][number]>(
      `SELECT id, nombre, activo FROM tecnicos
        WHERE nombre ILIKE $1 ESCAPE '\\'
        ORDER BY activo DESC, (nombre ILIKE $2 ESCAPE '\\') DESC, nombre
        LIMIT ${POR_GRUPO}`,
      [contiene, empieza],
    ),
  ]);
  return { equipos, incidencias, salas, tecnicos };
}
