import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { MENSAJES } from '@/lib/reglas/errores';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'development-only-secret-change-me');

function rechazar(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { ok: false, error: { codigo: 'NO_AUTORIZADO', mensaje: MENSAJES.NO_AUTORIZADO, detalles: null } },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('dcarv_session')?.value;
  if (!token) return rechazar(request);
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return rechazar(request);
  }
}

export const config = { matcher: ['/dashboard/:path*', '/soporte/:path*', '/api/soporte/:path*'] };
