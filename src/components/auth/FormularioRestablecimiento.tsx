'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FormularioRestablecimiento({ token }: { token: string }) {
	const router = useRouter();
	const [contrasena, setContrasena] = useState('');
	const [confirmacion, setConfirmacion] = useState('');
	const [error, setError] = useState('');
	const [procesando, setProcesando] = useState(false);

	async function guardarContrasena(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setError('');
		if (contrasena.length < 8) {
			setError('La contraseña debe tener al menos 8 caracteres.');
			return;
		}
		if (contrasena !== confirmacion) {
			setError('Las contraseñas no coinciden.');
			return;
		}

		setProcesando(true);
		try {
			const respuesta = await fetch('/api/auth/restablecer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, contrasena, confirmacion }),
			});
			const resultado = await respuesta.json() as { error?: string };
			if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo actualizar la contraseña.');
			router.replace('/login?restablecida=1');
		} catch (errorCapturado) {
			setError(errorCapturado instanceof Error ? errorCapturado.message : 'No se pudo actualizar la contraseña.');
		} finally {
			setProcesando(false);
		}
	}

	return (
		<form className="mt-8 grid gap-5" onSubmit={guardarContrasena}>
			<Input id="contrasena-nueva" label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} helperText="Mínimo 8 caracteres." required value={contrasena} onChange={(evento) => setContrasena(evento.target.value)} />
			<Input id="confirmacion-contrasena" label="Confirmar nueva contraseña" type="password" autoComplete="new-password" required value={confirmacion} onChange={(evento) => setConfirmacion(evento.target.value)} />
			{error ? <p role="alert" className="text-sm text-baja">{error}</p> : null}
			<Button type="submit" size="lg" className="w-full" loading={procesando}>Guardar contraseña</Button>
		</form>
	);
}