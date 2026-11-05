import { NextResponse } from 'next/server';
import { iniciarSesion, ponerCookieSesion } from '@/lib/auth/acceso';

export async function POST(request: Request) {
	let body: { email?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
	}

	if (!body.email || !body.password) {
		return NextResponse.json({ error: 'Email y contraseña son obligatorios', code: 'VALIDATION_ERROR' }, { status: 400 });
	}

	try {
		const acceso = await iniciarSesion(body.email, body.password);
		if (!acceso.ok) {
			return NextResponse.json({ error: acceso.error, code: acceso.code }, { status: acceso.status });
		}
		return ponerCookieSesion(NextResponse.json({ success: true, data: acceso.usuario }), acceso.token);
	} catch {
		return NextResponse.json({ error: 'Servicio de autenticación no disponible', code: 'AUTH_UNAVAILABLE' }, { status: 503 });
	}
}
