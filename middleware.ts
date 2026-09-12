import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'development-only-secret-change-me');
export async function middleware(request: NextRequest) { const token = request.cookies.get('dcarv_session')?.value; if (!token) return NextResponse.redirect(new URL('/login', request.url)); try { await jwtVerify(token, secret); return NextResponse.next(); } catch { return NextResponse.redirect(new URL('/login', request.url)); } }
export const config = { matcher: ['/dashboard/:path*'] };