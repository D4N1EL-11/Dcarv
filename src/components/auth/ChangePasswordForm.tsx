'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ChangePasswordForm({ email }: { email: string }) {
	const [accountEmail, setAccountEmail] = useState(email);
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

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail.trim())) {
			setError('Ingresa un correo electrónico válido.');
			return;
		}
		if (newPassword.length < 8) {
			setError('La nueva contraseña debe tener al menos 8 caracteres.');
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
				body: JSON.stringify({ email: accountEmail.trim(), currentPassword, newPassword }),
			});
			const result = (await response.json()) as { error?: string };
			if (!response.ok) throw new Error(result.error || 'No se pudo actualizar la contraseña.');

			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setNotice('Tu contraseña se actualizó correctamente.');
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la contraseña.');
		} finally {
			setSaving(false);
		}
	}

	return (
		<form className="mt-6 grid max-w-xl gap-5" onSubmit={submit}>
			<Input
				id="account-email"
				label="Correo de la cuenta"
				type="email"
				autoComplete="email"
				required
				value={accountEmail}
				onChange={(event) => setAccountEmail(event.target.value)}
			/>
			<Input
				id="current-password"
				label="Contraseña actual"
				type="password"
				autoComplete="current-password"
				required
				value={currentPassword}
				onChange={(event) => setCurrentPassword(event.target.value)}
			/>
			<Input
				id="new-password"
				label="Nueva contraseña"
				type="password"
				autoComplete="new-password"
				minLength={8}
				helperText="Mínimo 8 caracteres."
				required
				value={newPassword}
				onChange={(event) => setNewPassword(event.target.value)}
			/>
			<Input
				id="confirm-password"
				label="Confirmar nueva contraseña"
				type="password"
				autoComplete="new-password"
				required
				value={confirmPassword}
				onChange={(event) => setConfirmPassword(event.target.value)}
			/>
			{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
			{notice ? <p role="status" className="text-sm text-emerald-700">{notice}</p> : null}
			<div>
				<Button type="submit" loading={saving}>Actualizar contraseña</Button>
			</div>
		</form>
	);
}