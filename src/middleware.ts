import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { esRolValido, puedeUsarApi, puedeVerPagina, redireccionSinPermiso, type Rol } from '@/lib/auth/permisos';
import { MENSAJES, type CodigoError } from '@/lib/reglas/errores';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'development-only-secret-change-me');

function errorApi(codigo: CodigoError, estado: number) {
  return NextResponse.json(
    { ok: false, error: { codigo, mensaje: MENSAJES[codigo], detalles: null } },
    { status: estado, headers: { 'Cache-Control': 'no-store' } },
  );
}

function rechazar(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) return errorApi('NO_AUTORIZADO', 401);
  // Se recuerda a dónde iba el usuario para volver ahí después de iniciar sesión.
  const destino = new URL('/login', request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith('/soporte')) destino.searchParams.set('siguiente', `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

// Primera barrera de los roles (lib/auth/permisos.ts). La segunda está en cada ruta API
// (exigirSoporte) y en las páginas de soporte (soloSoporte).
function autorizar(request: NextRequest, rol: Rol) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/soporte')) {
    return puedeUsarApi(rol, request.method, pathname) ? NextResponse.next() : errorApi('SIN_PERMISO', 403);
  }
  if (pathname.startsWith('/soporte') && !puedeVerPagina(rol, pathname)) {
    return NextResponse.redirect(new URL(redireccionSinPermiso(rol, pathname), request.url));
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('dcarv_session')?.value;
  if (!token) return rechazar(request);
  let rol: Rol;
  try {
    const { payload } = await jwtVerify(token, secret);
    // Un token sin rol válido se trata como cuenta de reporte: nunca se concede de más.
    rol = esRolValido(payload.role) ? payload.role : 'viewer';
  } catch {
    return rechazar(request);
  }
  return autorizar(request, rol);
}

export const config = { matcher: ['/dashboard/:path*', '/soporte/:path*', '/api/soporte/:path*'] };
