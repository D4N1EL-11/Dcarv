import { exigirSoporte } from '@/lib/auth/sesion';
import { actualizarHojaDeVida, obtenerHojaDeVida } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaHojaDeVida } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  return responderOk(await obtenerHojaDeVida(decodeURIComponent((await params).codigo)));
});

// Reemplaza la hoja de vida completa (un campo vacío queda sin dato).
export const PUT = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const { codigo } = await params;
  await actualizarHojaDeVida(decodeURIComponent(codigo), esquemaHojaDeVida.parse(await leerCuerpo(request)));
  return responderOk({ actualizada: true });
});
