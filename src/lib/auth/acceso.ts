import { NextResponse } from 'next/server';
import { createToken } from '@/lib/auth/jwt';
import { buscarUsuarioPorEmail } from '@/lib/dataService';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

// Acceso compartido por el login y el registro.
//
// La app no depende de correos de confirmación: el correo integrado de Supabase solo entrega
// a los miembros del equipo del proyecto, y Resend, sin un dominio verificado, solo a su dueño.
// Por eso las cuentas se crean confirmadas y las que quedaron esperando ese correo se activan.

type Rol = 'admin' | 'editor' | 'viewer';
export type UsuarioSesion = { id: string; email: string; role: Rol };
export type ResultadoAcceso =
	| { ok: true; usuario: UsuarioSesion; token: string }
	| { ok: false; status: 401 | 500 | 503; error: string; code: string };

const NO_DISPONIBLE: ResultadoAcceso = {
	ok: false,
	status: 503,
	error: 'Servicio de autenticación no disponible',
	code: 'AUTH_UNAVAILABLE',
};
const CREDENCIALES_INVALIDAS: ResultadoAcceso = {
	ok: false,
	status: 401,
	error: 'Credenciales inválidas',
	code: 'UNAUTHORIZED',
};

/** Id de una cuenta existente cuyo correo nunca se confirmó, o null. */
export async function buscarCuentaPendiente(email: string): Promise<string | null> {
	const usuario = await buscarUsuarioPorEmail(email);
	if (!usuario) return null;
	const { data, error } = await createSupabaseAdminClient().auth.admin.getUserById(usuario.id);
	if (error || !data.user || data.user.email_confirmed_at) return null;
	return usuario.id;
}

/** Marca el correo como confirmado y, si se indica, fija la contraseña. */
export async function activarCuenta(id: string, password?: string): Promise<void> {
	const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(id, {
		email_confirm: true,
		...(password ? { password } : {}),
	});
	if (error) throw new Error('No se pudo activar la cuenta.');
}

export async function iniciarSesion(email: string, password: string): Promise<ResultadoAcceso> {
	const supabase = createSupabaseServerClient();
	let { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });

	// Supabase responde "email_not_confirmed" solo cuando la contraseña es correcta: es una
	// cuenta que quedó esperando el correo de confirmación. Se activa y se reintenta.
	if (error?.code === 'email_not_confirmed') {
		const pendiente = await buscarCuentaPendiente(email);
		if (pendiente) {
			await activarCuenta(pendiente);
			({ data: auth, error } = await supabase.auth.signInWithPassword({ email, password }));
		}
	}

	if (error || !auth.user || !auth.session) {
		return error && (error.status ?? 0) >= 500 ? NO_DISPONIBLE : CREDENCIALES_INVALIDAS;
	}

	const { data: perfil, error: errorPerfil } = await createSupabaseServerClient(auth.session.access_token)
		.from('users')
		.select('id, email, role')
		.eq('id', auth.user.id)
		.single();

	if (errorPerfil || !perfil) {
		return { ok: false, status: 500, error: 'No se encontró el perfil del usuario', code: 'USER_PROFILE_NOT_FOUND' };
	}

	const usuario: UsuarioSesion = { id: perfil.id, email: perfil.email, role: perfil.role as Rol };
	const token = await createToken({ userId: usuario.id, email: usuario.email, role: usuario.role });
	return { ok: true, usuario, token };
}

export function ponerCookieSesion(respuesta: NextResponse, token: string): NextResponse {
	respuesta.cookies.set('dcarv_session', token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24,
		path: '/',
	});
	return respuesta;
}
