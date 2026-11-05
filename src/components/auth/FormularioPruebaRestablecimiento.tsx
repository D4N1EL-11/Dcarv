'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FormularioPruebaRestablecimiento() {
	const [email, setEmail] = useState('');
	const [enlace, setEnlace] = useState('');
	const [error, setError] = useState('');
	const [procesando, setProcesando] = useState(false);

	async function generarEnlace(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setEnlace('');
		setError('');
		setProcesando(true);
		try {
			const respuesta = await fetch('/api/auth/recuperar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), modoPrueba: true }),
			});
			const resultado = await respuesta.json() as { enlacePrueba?: string | null; error?: string };
			if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo generar el enlace.');
			if (!resultado.enlacePrueba) {
				setError('No se pudo generar el enlace. Comprueba el correo o espera a que se renueve el límite de solicitudes.');
				return;
			}
			setEnlace(resultado.enlacePrueba);
		} catch (errorCapturado) {
			setError(errorCapturado instanceof Error ? errorCapturado.message : 'No se pudo generar el enlace.');
		} finally {
			setProcesando(false);
		}
	}

	return (
		<form className="mt-8 grid gap-5" onSubmit={generarEnlace}>
			<Input id="email-prueba-restablecimiento" label="Correo registrado" type="email" autoComplete="email" required value={email} onChange={(evento) => setEmail(evento.target.value)} />
			{error ? <p role="alert" className="text-sm text-baja">{error}</p> : null}
			{enlace ? <p role="status" className="text-sm text-funcional">Enlace listo. Abre la página para definir una nueva contraseña.</p> : null}
			<Button type="submit" size="lg" className="w-full" loading={procesando}>Generar enlace local</Button>
			{enlace ? <Link href={enlace} className="break-all font-medium text-[var(--accent)] underline">Abrir restablecimiento</Link> : null}
		</form>
	);
}