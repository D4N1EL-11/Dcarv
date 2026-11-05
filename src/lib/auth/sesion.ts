import { redirect } from 'next/navigation';
import { getSession } from './session';
import { fijarActor, type Actor } from './contexto';
import { esRolValido, esSoporte, INICIO_REPORTE } from './permisos';
import { rolActual } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export type Sesion = Actor;

// El rol viaja en el token firmado al iniciar sesión. Un token sin rol válido (anterior a los
// roles) se trata como cuenta de reporte: nunca se concede de más.
export async function obtenerSesion(): Promise<Sesion | null> {
  const sesion = await getSession();
  if (!sesion) return null;
  return { id: sesion.userId, email: sesion.email, rol: esRolValido(sesion.role) ? sesion.role : 'viewer' };
}

export async function exigirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorDeNegocio('NO_AUTORIZADO');
  fijarActor(sesion);
  return sesion;
}

// Rutas API de gestión: salas, equipos, técnicos, estados, asignaciones, cierres y consultas.
// El rol se lee de la base (no del token): quitarle el rol de soporte a una cuenta surte efecto
// en su siguiente acción, sin esperar a que venza su sesión.
export async function exigirSoporte(): Promise<Sesion> {
  const sesion = await exigirSesion();
  if (!esSoporte(sesion.rol)) throw new ErrorDeNegocio('SIN_PERMISO');
  const rol = await rolActual(sesion.id);
  if (!esSoporte(rol)) throw new ErrorDeNegocio('SIN_PERMISO');
  const vigente = { ...sesion, rol: rol! };
  fijarActor(vigente);
  return vigente;
}

// Páginas solo de soporte (el middleware ya redirige; esto es la segunda barrera).
export async function soloSoporte(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  if (!esSoporte(sesion.rol)) redirect(INICIO_REPORTE);
  return sesion;
}
