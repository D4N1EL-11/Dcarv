import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const updateUserSchema = z.object({
	email: z.string().email().optional(),
	password: z.string().min(8).optional(),
	role: z.enum(['admin', 'editor', 'viewer']).optional(),
}).refine((body) => body.email !== undefined || body.password !== undefined || body.role !== undefined);

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
	const session = await getSession();
	if (!session) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 });
	if (session.role !== 'admin') return NextResponse.json({ error: 'Se requiere rol administrador', code: 'FORBIDDEN' }, { status: 403 });

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
	}
	const parsed = updateUserSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Indica al menos un campo válido para actualizar', code: 'VALIDATION_ERROR' }, { status: 400 });

	const { id } = await context.params;
	if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Identificador inválido', code: 'VALIDATION_ERROR' }, { status: 400 });

	try {
		const supabase = createSupabaseAdminClient();
		const { data: current, error: currentError } = await supabase
			.from('users')
			.select('id, email, role')
			.eq('id', id)
			.single();
		if (currentError || !current) return NextResponse.json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' }, { status: 404 });

		if (parsed.data.role && current.role === 'admin' && parsed.data.role !== 'admin') {
			if (id === session.userId) return NextResponse.json({ error: 'No puedes quitarte tu propio rol de administrador', code: 'SELF_DEMOTION_FORBIDDEN' }, { status: 409 });
			const { data: admins, error: adminsError } = await supabase.from('users').select('id').eq('role', 'admin');
			if (adminsError || !admins || admins.length <= 1) {
				return NextResponse.json({ error: 'Debe permanecer al menos un administrador', code: 'LAST_ADMIN_REQUIRED' }, { status: 409 });
			}
		}

		const authUpdate: { email?: string; password?: string; email_confirm?: boolean } = {};
		if (parsed.data.email) {
			authUpdate.email = parsed.data.email;
			authUpdate.email_confirm = true;
		}
		if (parsed.data.password) authUpdate.password = parsed.data.password;
		if (Object.keys(authUpdate).length > 0) {
			const { error } = await supabase.auth.admin.updateUserById(id, authUpdate);
			if (error) return NextResponse.json({ error: 'No se pudo actualizar la cuenta de autenticación', code: 'AUTH_USER_UPDATE_FAILED' }, { status: 400 });
		}

		if (parsed.data.role) {
			const { error } = await supabase.from('users').update({ role: parsed.data.role }).eq('id', id);
			if (error) return NextResponse.json({ error: 'No se pudo actualizar el rol', code: 'USER_ROLE_UPDATE_FAILED' }, { status: 500 });
		}

		const { data: updated, error: updatedError } = await supabase
			.from('users')
			.select('id, email, role, created_at, updated_at')
			.eq('id', id)
			.single();
		if (updatedError || !updated) return NextResponse.json({ error: 'No se pudo cargar el usuario actualizado', code: 'USER_UPDATE_FAILED' }, { status: 500 });
		return NextResponse.json({ success: true, data: updated });
	} catch {
		return NextResponse.json({ error: 'Servicio de usuarios no disponible', code: 'USER_SERVICE_UNAVAILABLE' }, { status: 503 });
	}
}