import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
	actualizarContrasenaUsuario,
	buscarTokenVigente,
	invalidarTokensPendientes,
	marcarTokenComoUsado,
} from '@/lib/dataService';
import { calcularHashToken } from '@/lib/tokenRecuperacion';

const restablecimientoSchema = z.object({
	token: z.string().regex(/^[\da-f]{64}$/i).transform((token) => token.toLowerCase()),
	contrasena: z.string().min(8),
	confirmacion: z.string(),
}).refine((datos) => datos.contrasena === datos.confirmacion);

const respuestaTokenInvalido = () => NextResponse.json({ error: 'El enlace no es válido o ya venció.' }, { status: 400 });

export async function POST(request: Request) {
	let cuerpo: unknown;
	try {
		cuerpo = await request.json();
	} catch {
		return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
	}

	const datos = restablecimientoSchema.safeParse(cuerpo);
	if (!datos.success) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres y ambas contraseñas deben coincidir.' }, { status: 400 });

	try {
		const tokenValido = await buscarTokenVigente(calcularHashToken(datos.data.token));
		if (!tokenValido) return respuestaTokenInvalido();

		const tokenConsumido = await marcarTokenComoUsado(tokenValido.id);
		if (!tokenConsumido) return respuestaTokenInvalido();
		await actualizarContrasenaUsuario(tokenValido.usuario_id, datos.data.contrasena);
		await invalidarTokensPendientes(tokenValido.usuario_id);

		return NextResponse.json({ success: true, message: 'La contraseña se restableció correctamente.' });
	} catch {
		return NextResponse.json({ error: 'No se pudo restablecer la contraseña. Inténtalo de nuevo.' }, { status: 503 });
	}
}