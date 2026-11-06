import { NextResponse } from 'next/server';
import { ponerCookieSesion } from '@/lib/auth/acceso';
import { createToken } from '@/lib/auth/jwt';
import { getSession } from '@/lib/auth/session';
import { rolActual } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

const SIN_CACHE = { 'Cache-Control': 'no-store' };

// Vuelve a firmar la sesión con el rol vigente en la base. El token guarda el rol del momento del
// login; cuando un administrador aprueba una solicitud de soporte o cambia un rol, el layout del
// módulo lo detecta y llama aquí para que el menú y los permisos cambien sin cerrar sesión.
// Solo reemite la identidad que ya trae la cookie: no sirve para cambiar de cuenta.
export async function POST() {
  const sesion = await getSession();
  if (!sesion) {
    return NextResponse.json({ ok: false, error: { codigo: 'NO_AUTORIZADO' } }, { status: 401, headers: SIN_CACHE });
  }
  const rol = await rolActual(sesion.userId);
  if (!rol) {
    // La cuenta ya no existe: la sesión se cierra.
    const respuesta = NextResponse.json({ ok: false, error: { codigo: 'NO_AUTORIZADO' } }, { status: 401, headers: SIN_CACHE });
    respuesta.cookies.delete('dcarv_session');
    return respuesta;
  }
  const token = await createToken({ userId: sesion.userId, email: sesion.email, role: rol });
  return ponerCookieSesion(NextResponse.json({ ok: true, datos: { rol } }, { headers: SIN_CACHE }), token);
}
