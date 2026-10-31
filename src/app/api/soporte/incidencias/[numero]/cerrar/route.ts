import { exigirSesion } from '@/lib/auth/sesion';
import { cerrarIncidencia } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

export const POST = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSesion();
  const { numero } = await params;
  await cerrarIncidencia(numero);
  return responderOk({ cerrada: true });
});
