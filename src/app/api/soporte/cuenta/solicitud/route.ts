import { exigirSesion } from '@/lib/auth/sesion';
import { solicitarSoporte } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

// "Mi cuenta": una cuenta de reporte con correo institucional pide (o vuelve a pedir) el acceso de
// soporte. Los administradores reciben un aviso; la regla está en lib/datos/usuarios.ts.
export const POST = conManejoDeErrores(async () => {
  const sesion = await exigirSesion();
  await solicitarSoporte(sesion.id);
  return responderOk({ solicitada: true }, 201);
});
