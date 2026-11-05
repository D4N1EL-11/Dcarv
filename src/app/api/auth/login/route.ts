import { NextResponse } from 'next/server';
import { iniciarSesion, ponerCookieSesion } from '@/lib/auth/acceso';
import { intentosRecientes, registrarIntento } from '@/lib/dataService';
import { evaluarBloqueo, MINUTOS_BLOQUEO, type EstadoBloqueo } from '@/lib/reglas/acceso';

// El freno a los intentos es una protección extra: si su tabla no responde, el login sigue.
async function estadoBloqueo(email: string): Promise<EstadoBloqueo | null> {
	try {
		const { intentos, ahora } = await intentosRecientes(email);
		return evaluarBloqueo(intentos, ahora);
	} catch (error) {
		console.error(error);
		return null;
	}
}

async function anotarIntento(email: string, exito: boolean): Promise<void> {
	try {
		await registrarIntento(email, exito);
	} catch (error) {
		console.error(error);
	}
}

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
	const email = body.email.trim().toLowerCase();

	try {
		const bloqueo = await estadoBloqueo(email);
		if (bloqueo?.bloqueado) {
			return NextResponse.json(
				{
					error: `Demasiados intentos fallidos. Espera ${bloqueo.minutosRestantes} ${bloqueo.minutosRestantes === 1 ? 'minuto' : 'minutos'} o recupera tu contraseña.`,
					code: 'TOO_MANY_ATTEMPTS',
					minutosRestantes: bloqueo.minutosRestantes,
				},
				{ status: 429, headers: { 'Retry-After': String(bloqueo.minutosRestantes * 60) } },
			);
		}

		const acceso = await iniciarSesion(email, body.password);
		if (!acceso.ok) {
			// Solo cuentan las credenciales incorrectas; una caída del servicio no es culpa de quien entra.
			if (acceso.status !== 401) return NextResponse.json({ error: acceso.error, code: acceso.code }, { status: acceso.status });
			await anotarIntento(email, false);
			const restantes = bloqueo ? Math.max(0, bloqueo.intentosRestantes - 1) : null;
			return NextResponse.json(
				{ error: acceso.error, code: acceso.code, intentosRestantes: restantes, minutosBloqueo: MINUTOS_BLOQUEO },
				{ status: 401 },
			);
		}
		await anotarIntento(email, true);
		return ponerCookieSesion(NextResponse.json({ success: true, data: acceso.usuario }), acceso.token);
	} catch {
		return NextResponse.json({ error: 'Servicio de autenticación no disponible', code: 'AUTH_UNAVAILABLE' }, { status: 503 });
	}
}
