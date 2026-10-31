import { getSession } from './session';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export async function obtenerSesion(): Promise<{ email: string } | null> {
  const sesion = await getSession();
  return sesion ? { email: sesion.email } : null;
}

export async function exigirSesion(): Promise<{ email: string }> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorDeNegocio('NO_AUTORIZADO');
  return sesion;
}
