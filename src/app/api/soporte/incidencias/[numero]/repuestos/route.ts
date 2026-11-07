import { exigirSoporte } from '@/lib/auth/sesion';
import { repuestosDeCaso, usarRepuesto } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaNumeroCaso, esquemaUsoRepuesto } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ numero: string }> };

export const GET = conManejoDeErrores(async (_request, { params }: Contexto) => {
  await exigirSoporte();
  return responderOk(await repuestosDeCaso(esquemaNumeroCaso.parse((await params).numero)));
});

// Anotar un repuesto usado en el caso: descuenta las existencias (SIN_EXISTENCIAS si no alcanzan).
export const POST = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const numero = esquemaNumeroCaso.parse((await params).numero);
  const { repuestoId, cantidad } = esquemaUsoRepuesto.parse(await leerCuerpo(request));
  await usarRepuesto(numero, repuestoId, cantidad);
  return responderOk({ registrado: true }, 201);
});
