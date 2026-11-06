import type { PoolClient } from 'pg';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { avisoComentario } from '@/lib/reglas/avisos';
import { puedeComentar, validarComentario, type TipoComentario } from '@/lib/reglas/comentario';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';
import { avisarA, avisarASoporte } from './avisos';

// Comentarios de una incidencia (M8): la conversación entre soporte y quien reportó la falla.
// Los permisos (quién lee y quién escribe) están en lib/reglas/comentario.ts.

export type FilaComentario = {
  id: number;
  autor: string;
  deSoporte: boolean;
  tipo: TipoComentario;
  texto: string;
  momento: string; // ISO 8601 en UTC
};

export type Autor = { id: string; email: string; soporte: boolean };

export function listarComentarios(numeroCaso: string): Promise<FilaComentario[]> {
  return consultar<FilaComentario>(
    `SELECT c.id, c.autor, c.de_soporte AS "deSoporte", c.tipo, c.texto,
            to_char(c.creado_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS momento
       FROM comentarios c JOIN incidencias i ON i.id = c.incidencia_id
      WHERE i.numero_caso = $1
      ORDER BY c.creado_en, c.id`,
    [numeroCaso],
  );
}

// Inserta un comentario dentro de una transacción ya abierta (la usa también el cierre del caso
// para dejar la nota de solución).
export async function insertarComentario(
  tx: PoolClient,
  incidenciaId: string,
  autor: Autor,
  texto: string,
  tipo: TipoComentario = 'comentario',
): Promise<FilaComentario> {
  const { rows } = await tx.query<FilaComentario>(
    `INSERT INTO comentarios (incidencia_id, autor_id, autor, de_soporte, tipo, texto)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, autor, de_soporte AS "deSoporte", tipo, texto,
               to_char(creado_en AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS momento`,
    [incidenciaId, autor.id, autor.email, autor.soporte, tipo, texto],
  );
  return rows[0]!;
}

// Comentario nuevo. Si escribe soporte, se avisa a quien reportó; si escribe quien reportó, se
// avisa al equipo de soporte. Todo en una transacción con el caso bloqueado: no se puede comentar
// un caso que se está cerrando en ese momento.
export async function agregarComentario(numeroCaso: string, textoCrudo: string, autor: Autor): Promise<FilaComentario> {
  const texto = validarComentario(textoCrudo);
  return conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ id: string; estado: EstadoIncidencia; reportado_por: string | null }>(
      'SELECT id, estado, reportado_por FROM incidencias WHERE numero_caso = $1 FOR UPDATE',
      [numeroCaso],
    );
    const caso = rows[0];
    if (!caso) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
    const quien = { soporte: autor.soporte, esQuienReporto: caso.reportado_por === autor.id };
    if (!puedeComentar(quien, caso.estado)) {
      throw caso.estado === 'cerrada' && (quien.soporte || quien.esQuienReporto)
        ? new ErrorDeNegocio('INCIDENCIA_CERRADA')
        : new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA'); // un caso ajeno no se revela
    }
    const comentario = await insertarComentario(tx, caso.id, autor, texto);
    const aviso = avisoComentario(numeroCaso, autor.soporte ? 'Soporte' : autor.email, texto);
    if (autor.soporte) await avisarA(tx, caso.reportado_por, aviso);
    else await avisarASoporte(tx, aviso);
    return comentario;
  });
}
