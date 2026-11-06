'use client';

import { useState, type FormEvent } from 'react';
import { CampoContrasena } from '@/components/auth/CampoContrasena';
import { MedidorContrasena } from '@/components/auth/MedidorContrasena';
import { Boton } from '@/components/ui/Boton';
import { LONGITUD_MINIMA_CONTRASENA } from '@/lib/reglas/contrasena';

// El correo sale de la sesión y no se edita: el servidor ya exige que coincida con ella.
export function ChangePasswordForm({ email }: { email: string }) {
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [saving, setSaving] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setNotice('');

		if (!currentPassword) {
			setError('Escribe tu contraseña actual.');
			return;
		}
		if ([...newPassword].length < LONGITUD_MINIMA_CONTRASENA) {
			setError(`La nueva contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`);
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('Las contraseñas nuevas no coinciden.');
			return;
		}
		if (newPassword === currentPassword) {
			setError('La nueva contraseña debe ser distinta a la actual.');
			return;
		}

		setSaving(true);
		try {
			const response = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, currentPassword, newPassword }),
			});
			const result = (await response.json().catch(() => ({}))) as { error?: string };
			if (!response.ok) throw new Error(result.error || 'No se pudo actualizar la contraseña.');

			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setNotice('Tu contraseña se actualizó. Úsala la próxima vez que inicies sesión.');
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la contraseña.');
		} finally {
			setSaving(false);
		}
	}

	return (
		<form className="grid gap-5" onSubmit={submit} noValidate>
			{/* Para que el gestor de contraseñas del navegador sepa de qué cuenta es. */}
			<input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
			<CampoContrasena
				id="current-password"
				label="Contraseña actual"
				autoComplete="current-password"
				value={currentPassword}
				onChange={(event) => setCurrentPassword(event.target.value)}
			/>
			<CampoContrasena
				id="new-password"
				label="Nueva contraseña"
				autoComplete="new-password"
				placeholder={`Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres`}
				value={newPassword}
				onChange={(event) => setNewPassword(event.target.value)}
			>
				<MedidorContrasena clave={newPassword} email={email} />
			</CampoContrasena>
			<CampoContrasena
				id="confirm-password"
				label="Confirmar nueva contraseña"
				autoComplete="new-password"
				value={confirmPassword}
				onChange={(event) => setConfirmPassword(event.target.value)}
			/>
			{error ? (
				<p role="alert" className="rounded-lg border border-baja/30 bg-baja/10 px-3.5 py-2.5 text-sm text-baja">{error}</p>
			) : null}
			{notice ? (
				<p role="status" className="rounded-lg border border-funcional/30 bg-funcional/10 px-3.5 py-2.5 text-sm text-funcional">{notice}</p>
			) : null}
			<div>
				<Boton type="submit" cargando={saving}>
					{saving ? 'Actualizando…' : 'Actualizar contraseña'}
				</Boton>
			</div>
		</form>
	);
}
