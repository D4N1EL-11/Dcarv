import { getToken } from '@vercel/connect';
import { Resend } from 'resend';

type DatosCorreo = { para: string; asunto: string; html: string };
type ResultadoCorreo = { ok: true; id: string } | { ok: false; error: string };

export async function obtenerClaveResend(): Promise<string> {
	const claveConfigurada = process.env.RESEND_API_KEY?.trim();
	if (claveConfigurada) return claveConfigurada;
	return getToken('resend/blue-pillar', { subject: { type: 'app' } });
}

export async function enviarCorreo({ para, asunto, html }: DatosCorreo): Promise<ResultadoCorreo> {
	try {
		const clave = await obtenerClaveResend();
		const resultado = await new Resend(clave).emails.send({
			from: process.env.RESEND_FROM || 'onboarding@resend.dev',
			to: para,
			subject: asunto,
			html,
		});
		if (resultado.error || !resultado.data?.id) {
			return { ok: false, error: resultado.error?.message || 'No se pudo enviar el correo.' };
		}
		return { ok: true, id: resultado.data.id };
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : 'No se pudo enviar el correo.' };
	}
}