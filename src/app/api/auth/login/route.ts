import { NextResponse } from 'next/server';
import { createToken } from '@/lib/auth/jwt';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type UserRole = 'admin' | 'editor' | 'viewer';

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
		const supabase = createSupabaseServerClient();
		const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
			email: body.email,
			password: body.password,
		});

		if (authError || !auth.user || !auth.session) {
			const status = authError && (authError.status ?? 0) >= 500 ? 503 : 401;
			return NextResponse.json(
				{ error: status === 401 ? 'Credenciales inválidas' : 'Servicio de autenticación no disponible', code: status === 401 ? 'UNAUTHORIZED' : 'AUTH_UNAVAILABLE' },
				{ status },
			);
		}

		const { data: user, error: profileError } = await createSupabaseServerClient(auth.session.access_token)
			.from('users')
			.select('id, email, role')
			.eq('id', auth.user.id)
			.single();

		if (profileError || !user) {
			return NextResponse.json({ error: 'No se encontró el perfil del usuario', code: 'USER_PROFILE_NOT_FOUND' }, { status: 500 });
		}

		const role = user.role as UserRole;
		const token = await createToken({ userId: user.id, email: user.email, role });
		const response = NextResponse.json({ success: true, data: { id: user.id, email: user.email, role } });
		response.cookies.set('dcarv_session', token, {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24,
			path: '/',
		});
		return response;
	} catch {
		return NextResponse.json({ error: 'Servicio de autenticación no disponible', code: 'AUTH_UNAVAILABLE' }, { status: 503 });
	}
}