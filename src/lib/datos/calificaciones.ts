import { LARGO_MAXIMO_COMENTARIO_CALIFICACION } from '@/lib/config/soporte';
import { conTransaccion } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { registrarEvento } from './eventos';

// Calificación del servicio (M16): quien reportó un caso cerrado califica la atención una vez.
export async function calificarIncidencia(
  numeroCaso: string,
  usuarioId: string,
  estrellas: number,
  comentario?: string | undefined,
): Promise<void> {
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'La calificación va de 1 a 5 estrellas.');
  }
  const nota = comentario?.trim() || null;
  if (nota && nota.length > LARGO_MAXIMO_COMENTARIO_CALIFICACION) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', `El comentario admite hasta ${LARGO_MAXIMO_COMENTARIO_CALIFICACION} caracteres.`);
  }
  const numero = numeroCaso.trim().toUpperCase();
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ id: string; estado: string; reportadoPor: string | null; calificacion: number | null; equipo: string }>(
      `SELECT i.id, i.estado, i.reportado_por AS "reportadoPor", i.calificacion, e.codigo AS equipo
         FROM incidencias i JOIN equipos e ON e.id = i.equipo_id
        WHERE i.numero_caso = $1
          FOR UPDATE OF i`,
      [numero],
    );
    const caso = rows[0];
    // Un caso ajeno responde igual que uno inexistente: no se revela qué casos hay.
    if (!caso || caso.reportadoPor !== usuarioId) throw new ErrorDeNegocio('INCIDENCIA_NO_ENCONTRADA');
    if (caso.estado !== 'cerrada') throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Solo se califica un caso cerrado.');
    if (caso.calificacion !== null) throw new ErrorDeNegocio('YA_CALIFICADA');
    await tx.query(
      'UPDATE incidencias SET calificacion = $1, calificacion_comentario = $2, calificada_en = now() WHERE id = $3',
      [estrellas, nota, caso.id],
    );
    await registrarEvento(tx, {
      accion: 'caso_calificado',
      numeroCaso: numero,
      equipoCodigo: caso.equipo,
      detalle: `${estrellas} de 5 estrellas`,
    });
  });
}
