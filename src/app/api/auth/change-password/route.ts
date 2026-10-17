import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

const changePasswordSchema = z.object({
	email: z.string().email(),
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8),
}).refine((body) => body.currentPassword !== body.newPassword);

export async function POST(request: Request) {
	const session = await getSession();
	if (!session) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
	}

	const parsed = changePasswordSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres y ser distinta a la actual', code: 'VALIDATION_ERROR' }, { status: 400 });

	try {
		const { data: profile, error: profileError } = await createSupabaseAdminClient()
			.from('users')
			.select('id, email')
			.eq('id', session.userId)
			.maybeSingle();

		if (profileError) {
			return NextResponse.json({ error: 'No se pudo verificar el usuario en la base de datos', code: 'USER_LOOKUP_FAILED' }, { status: 503 });
		}
		if (!profile || profile.email.toLowerCase() !== parsed.data.email.trim().toLowerCase() || profile.email.toLowerCase() !== session.email.toLowerCase()) {
			return NextResponse.json({ error: 'El correo no está registrado para esta cuenta', code: 'USER_NOT_FOUND' }, { status: 403 });
		}

		const supabase = createSupabaseServerClient();
		const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
			email: profile.email,
			password: parsed.data.currentPassword,
		});

		if (authError || !auth.user || auth.user.id !== session.userId) {
			if (authError && (authError.status ?? 0) >= 500) {
				return NextResponse.json({ error: 'Servicio de autenticación no disponible', code: 'AUTH_UNAVAILABLE' }, { status: 503 });
			}
			return NextResponse.json({ error: 'La contraseña actual es incorrecta', code: 'CURRENT_PASSWORD_INVALID' }, { status: 400 });
		}

		const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
		if (error) {
			const status = error.status && error.status >= 500 ? 503 : 400;
			return NextResponse.json(
				{ error: status === 503 ? 'Servicio de autenticación no disponible' : 'No se pudo actualizar la contraseña', code: status === 503 ? 'AUTH_UNAVAILABLE' : 'PASSWORD_UPDATE_FAILED' },
				{ status },
			);
		}

		return NextResponse.json({ success: true, data: { updated: true } });
	} catch {
		return NextResponse.json({ error: 'Servicio de autenticación no disponible', code: 'AUTH_UNAVAILABLE' }, { status: 503 });
	}
}