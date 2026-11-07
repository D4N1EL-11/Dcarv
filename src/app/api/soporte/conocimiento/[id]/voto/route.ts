import { exigirSesion } from '@/lib/auth/sesion';
import { votarArticulo } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaId, esquemaVoto } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ id: string }> };

// "¿Le sirvió esta guía?" (cualquier cuenta).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSesion();
  const id = esquemaId.parse((await params).id);
  await votarArticulo(id, esquemaVoto.parse(await leerCuerpo(request)).util);
  return responderOk({ votado: true });
});
