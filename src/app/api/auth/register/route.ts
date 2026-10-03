import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });
	}

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 });

	try {
		const supabase = createSupabaseServerClient();
		const { data, error } = await supabase.auth.signUp(parsed.data);
		if (error) {
			const status = error.status && error.status >= 500 ? 503 : 400;
			return NextResponse.json(
				{ error: status === 503 ? 'Servicio de autenticación no disponible' : 'No se pudo crear la cuenta', code: status === 503 ? 'AUTH_UNAVAILABLE' : 'REGISTRATION_FAILED' },
				{ status },
			);
		}

		return NextResponse.json(
			{ success: true, data: { id: data.user?.id ?? null, confirmationRequired: !data.session } },
			{ status: 201 },
		);
	} catch {
		return NextResponse.json({ error: 'Servicio de autenticación no disponible', code: 'AUTH_UNAVAILABLE' }, { status: 503 });
	}
}