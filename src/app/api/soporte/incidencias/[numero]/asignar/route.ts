import { exigirSoporte } from '@/lib/auth/sesion';
import { asignarTecnico } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAsignar } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const { numero } = await params;
  const { tecnicoId } = esquemaAsignar.parse(await leerCuerpo(request));
  await asignarTecnico(numero, tecnicoId);
  return responderOk({ asignada: true });
});
