import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const createUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	role: z.enum(['admin', 'editor', 'viewer']),
});

async function authorizeAdmin() {
	const session = await getSession();
	if (!session) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 });
	if (session.role !== 'admin') return NextResponse.json({ error: 'Se requiere rol administrador', code: 'FORBIDDEN' }, { status: 403 });
	return null;
}

export async function GET() {
	const denied = await authorizeAdmin();
	if (denied) return denied;

	try {
		const { data, error } = await createSupabaseAdminClient()
			.from('users')
			.select('id, email, role, created_at, updated_at')
			.order('created_at', { ascending: false });
		if (error) return NextResponse.json({ error: 'No se pudieron cargar los usuarios', code: 'USER_LIST_FAILED' }, { status: 503 });
		return NextResponse.json({ success: true, data });
	} catch {
		return NextResponse.json({ error: 'Servicio de usuarios no disponible', code: 'USER_SERVICE_UNAVAILABLE' }, { status: 503 });
	}
}

export async function POST(request: Request) {
	const denied = await authorizeAdmin();
	if (denied) return denied;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
	}
	const parsed = createUserSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Email, contraseña y rol son obligatorios', code: 'VALIDATION_ERROR' }, { status: 400 });

	try {
		const supabase = createSupabaseAdminClient();
		const { data, error } = await supabase.auth.admin.createUser({
			email: parsed.data.email,
			password: parsed.data.password,
			email_confirm: true,
		});
		if (error || !data.user) {
			return NextResponse.json({ error: 'No se pudo crear el usuario. Comprueba que el email no esté registrado.', code: 'USER_CREATE_FAILED' }, { status: 400 });
		}

		const { data: profile, error: profileError } = await supabase
			.from('users')
			.update({ role: parsed.data.role })
			.eq('id', data.user.id)
			.select('id, email, role, created_at, updated_at')
			.single();
		if (profileError || !profile) {
			await supabase.auth.admin.deleteUser(data.user.id);
			return NextResponse.json({ error: 'No se pudo guardar el perfil del usuario', code: 'USER_PROFILE_FAILED' }, { status: 500 });
		}

		return NextResponse.json({ success: true, data: profile }, { status: 201 });
	} catch {
		return NextResponse.json({ error: 'Servicio de usuarios no disponible', code: 'USER_SERVICE_UNAVAILABLE' }, { status: 503 });
	}
}