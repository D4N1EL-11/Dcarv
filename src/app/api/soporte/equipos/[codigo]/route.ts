import { exigirSesion } from '@/lib/auth/sesion';
import { obtenerEquipo } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSesion();
  const { codigo } = await params;
  return responderOk(await obtenerEquipo(codigo));
});
