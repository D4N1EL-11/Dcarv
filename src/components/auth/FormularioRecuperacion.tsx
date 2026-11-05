'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FormularioRecuperacion({ emailInicial }: { emailInicial: string }) {
	const [email, setEmail] = useState(emailInicial);
	const [mensaje, setMensaje] = useState('');
	const [error, setError] = useState('');
	const [procesando, setProcesando] = useState(false);

	async function enviarSolicitud(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setError('');
		setMensaje('');
		setProcesando(true);
		try {
			const respuesta = await fetch('/api/auth/recuperar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim() }),
			});
			const resultado = await respuesta.json() as { message?: string; error?: string };
			if (!respuesta.ok) throw new Error(resultado.error || 'Ingresa un correo electrónico válido.');
			setMensaje(resultado.message || 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.');
		} catch (errorCapturado) {
			setError(errorCapturado instanceof Error ? errorCapturado.message : 'No se pudo procesar la solicitud.');
		} finally {
			setProcesando(false);
		}
	}

	return (
		<>
			<form className="mt-8 grid gap-5" onSubmit={enviarSolicitud}>
				<Input id="email-recuperacion" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@dcarv.com" required value={email} onChange={(evento) => setEmail(evento.target.value)} />
				{error ? <p role="alert" className="text-sm text-baja">{error}</p> : null}
				{mensaje ? <p role="status" className="text-sm text-funcional">{mensaje}</p> : null}
				<Button type="submit" size="lg" className="w-full" loading={procesando}>Enviar enlace</Button>
			</form>
			<p className="mt-5 text-center text-sm"><Link href="/login" className="font-medium text-[var(--accent)] hover:underline">Volver al inicio de sesión</Link></p>
		</>
	);
}