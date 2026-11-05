import { NextResponse } from 'next/server';
import { z } from 'zod';
import { activarCuenta, buscarCuentaPendiente, iniciarSesion, ponerCookieSesion } from '@/lib/auth/acceso';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const registerSchema = z.object({
	email: z.string().trim().toLowerCase().email(),
	password: z.string().min(8),
});

function error(status: number, mensaje: string, code: string) {
	return NextResponse.json({ error: mensaje, code }, { status });
}

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return error(400, 'Datos inválidos', 'VALIDATION_ERROR');
	}

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) return error(400, 'Datos inválidos', 'VALIDATION_ERROR');
	const { email, password } = parsed.data;

	try {
		// La cuenta se crea ya confirmada: no se depende de un correo de confirmación (ver lib/auth/acceso.ts).
		const { error: errorCreacion } = await createSupabaseAdminClient().auth.admin.createUser({
			email,
			password,
			email_confirm: true,
		});

		if (errorCreacion) {
			if (errorCreacion.code === 'email_exists' || errorCreacion.code === 'user_already_exists') {
				// Una cuenta que quedó esperando el correo de confirmación nunca pudo usarse: se activa
				// con la contraseña nueva. Una cuenta ya activa no se toca.
				const pendiente = await buscarCuentaPendiente(email);
				if (!pendiente) {
					return error(409, 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.', 'EMAIL_EXISTS');
				}
				await activarCuenta(pendiente, password);
			} else if (errorCreacion.code === 'weak_password') {
				return error(400, 'La contraseña es muy débil. Usa una más larga o combina letras y números.', 'WEAK_PASSWORD');
			} else if ((errorCreacion.status ?? 500) >= 500) {
				return error(503, 'Servicio de autenticación no disponible', 'AUTH_UNAVAILABLE');
			} else {
				return error(400, 'No se pudo crear la cuenta', 'REGISTRATION_FAILED');
			}
		}

		const acceso = await iniciarSesion(email, password);
		if (!acceso.ok) {
			return NextResponse.json({ success: true, data: { sesionIniciada: false } }, { status: 201 });
		}
		return ponerCookieSesion(
			NextResponse.json({ success: true, data: { ...acceso.usuario, sesionIniciada: true } }, { status: 201 }),
			acceso.token,
		);
	} catch {
		return error(503, 'Servicio de autenticación no disponible', 'AUTH_UNAVAILABLE');
	}
}
