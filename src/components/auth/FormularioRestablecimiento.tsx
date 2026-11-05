'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CampoContrasena } from '@/components/auth/CampoContrasena';
import { MedidorContrasena } from '@/components/auth/MedidorContrasena';
import { Button } from '@/components/ui/button';
import { LONGITUD_MINIMA_CONTRASENA } from '@/lib/reglas/contrasena';

export function FormularioRestablecimiento({ token }: { token: string }) {
	const router = useRouter();
	const [contrasena, setContrasena] = useState('');
	const [confirmacion, setConfirmacion] = useState('');
	const [error, setError] = useState('');
	const [procesando, setProcesando] = useState(false);

	async function guardarContrasena(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setError('');
		if ([...contrasena].length < LONGITUD_MINIMA_CONTRASENA) {
			setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`);
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
			const resultado = (await respuesta.json().catch(() => ({}))) as { error?: string };
			if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo actualizar la contraseña.');
			router.replace('/login?restablecida=1');
		} catch (errorCapturado) {
			setError(errorCapturado instanceof Error ? errorCapturado.message : 'No se pudo actualizar la contraseña.');
		} finally {
			setProcesando(false);
		}
	}

	return (
		<form className="mt-8 grid gap-5" onSubmit={guardarContrasena} noValidate>
			<CampoContrasena
				id="contrasena-nueva"
				label="Nueva contraseña"
				autoComplete="new-password"
				placeholder={`Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres`}
				autoFocus
				value={contrasena}
				onChange={(evento) => setContrasena(evento.target.value)}
			>
				<MedidorContrasena clave={contrasena} />
			</CampoContrasena>
			<CampoContrasena
				id="confirmacion-contrasena"
				label="Confirmar nueva contraseña"
				autoComplete="new-password"
				placeholder="Repite la contraseña"
				value={confirmacion}
				onChange={(evento) => setConfirmacion(evento.target.value)}
			/>
			{error ? (
				<p role="alert" className="rounded-lg border border-baja/30 bg-baja/10 px-3.5 py-2.5 text-sm text-baja">{error}</p>
			) : null}
			<Button type="submit" size="lg" className="w-full" loading={procesando}>
				{procesando ? 'Guardando…' : 'Guardar contraseña'}
			</Button>
		</form>
	);
}
