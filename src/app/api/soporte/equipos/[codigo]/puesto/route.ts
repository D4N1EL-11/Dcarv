import { exigirSoporte } from '@/lib/auth/sesion';
import { moverEquipo } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaPuesto } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: Promise<{ codigo: string }> };

// Mover un equipo a otro puesto del mapa de su sala (si está ocupado, se intercambian).
export const PATCH = conManejoDeErrores(async (request, { params }: Contexto) => {
  await exigirSoporte();
  const { codigo } = await params;
  const puesto = esquemaPuesto.parse(await leerCuerpo(request));
  await moverEquipo(decodeURIComponent(codigo), puesto);
  return responderOk({ movido: true });
});
