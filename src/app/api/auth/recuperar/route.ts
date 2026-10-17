import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
	buscarUsuarioPorEmail,
	contarSolicitudesRestablecimiento,
	crearTokenRestablecimiento,
	invalidarTokensPendientes,
} from '@/lib/dataService';
import { enviarCorreo } from '@/lib/correo';
import { plantillaRecuperacion } from '@/lib/plantillasCorreo';
import { calcularHashToken, generarToken } from '@/lib/tokenRecuperacion';
import { obtenerUrlBase } from '@/lib/urlBase';

const solicitudSchema = z.object({
	email: z.string().trim().email(),
	modoPrueba: z.boolean().optional(),
});
const mensajeGenerico = 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.';
const respuestaGenerica = () => NextResponse.json({ success: true, message: mensajeGenerico });

export async function POST(request: Request) {
	let cuerpo: unknown;
	try {
		cuerpo = await request.json();
	} catch {
		return NextResponse.json({ error: 'Ingresa un correo electrónico válido.' }, { status: 400 });
	}

	const datos = solicitudSchema.safeParse(cuerpo);
	if (!datos.success) return NextResponse.json({ error: 'Ingresa un correo electrónico válido.' }, { status: 400 });

	try {
		const usuario = await buscarUsuarioPorEmail(datos.data.email);
		const esPruebaLocal = process.env.NODE_ENV === 'development' && datos.data.modoPrueba === true;
		if (!usuario) {
			return esPruebaLocal
				? NextResponse.json({ success: true, message: mensajeGenerico, enlacePrueba: null })
				: respuestaGenerica();
		}

		const solicitudes = await contarSolicitudesRestablecimiento(usuario.id);
		if (solicitudes >= 3) {
			return esPruebaLocal
				? NextResponse.json({ success: true, message: mensajeGenerico, enlacePrueba: null })
				: respuestaGenerica();
		}

		await invalidarTokensPendientes(usuario.id);
		const token = generarToken();
		await crearTokenRestablecimiento(
			usuario.id,
			calcularHashToken(token),
			new Date(Date.now() + 30 * 60 * 1000).toISOString(),
		);

		const enlace = new URL('/restablecer-contrasena', obtenerUrlBase());
		enlace.searchParams.set('token', token);
		if (esPruebaLocal) {
			return NextResponse.json({
				success: true,
				message: mensajeGenerico,
				enlacePrueba: `${enlace.pathname}${enlace.search}`,
			});
		}

		await enviarCorreo({
			para: usuario.email,
			asunto: 'Restablecer contraseña',
			html: plantillaRecuperacion(enlace.toString()),
		});
	} catch {
		return respuestaGenerica();
	}

	return respuestaGenerica();
}