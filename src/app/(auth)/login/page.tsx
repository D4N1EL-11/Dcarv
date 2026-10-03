'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';

const loginTheme = {
	'--bg-primary': '#f3efe7',
	'--bg-secondary': '#fffdf8',
	'--text-primary': '#172033',
	'--text-secondary': '#657086',
	'--line': 'rgba(23, 32, 51, 0.15)',
	'--accent': '#e15f3d',
	'--accent-soft': 'rgba(225, 95, 61, 0.12)',
	fontFamily: "'Avenir Next', 'Segoe UI', sans-serif",
} as CSSProperties;

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [authError, setAuthError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setAuthError('');

		const normalizedEmail = email.trim();
		const nextEmailError = !normalizedEmail
			? 'Ingresa tu correo electrónico.'
			: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
				? ''
				: 'Ingresa un correo electrónico válido.';
		const nextPasswordError = password.trim() ? '' : 'Ingresa tu contraseña.';

		setEmailError(nextEmailError);
		setPasswordError(nextPasswordError);

		if (nextEmailError || nextPasswordError) return;

		setIsSubmitting(true);
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: normalizedEmail, password }),
			});
			const result = (await response.json()) as { error?: string };
			if (!response.ok) {
				setAuthError(response.status === 401 ? 'Correo o contraseña incorrectos' : result.error || 'No se pudo iniciar sesión. Inténtalo de nuevo.');
				return;
			}
			router.replace('/dashboard');
			router.refresh();
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main
			className="grid min-h-screen place-items-center bg-[var(--bg-primary)] py-10 text-[var(--text-primary)]"
			style={loginTheme}
		>
			<Container maxWidth="sm" className="animate-float-in">
				<Card className="mx-auto w-full max-w-md overflow-hidden p-0 shadow-xl shadow-[#172033]/10">
					<div className="h-1.5 bg-[var(--accent)]" />
					<div className="p-6 sm:p-9">
						<div className="mb-8 flex items-center gap-3">
							<div className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-lg font-bold text-white">
								D
							</div>
							<div>
								<p className="text-lg font-black">DCARV</p>
								<p className="text-xs text-[var(--text-secondary)]">Estado de salas de computación</p>
							</div>
						</div>

						<p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">
							<span className="size-2 rounded-full bg-[#e15f3d]" />
							Acceso al sistema
						</p>
						<h1 className="text-3xl font-black">Bienvenido de nuevo</h1>
						<p className="mt-2 text-sm text-[var(--text-secondary)]">
							Inicia sesión para revisar tus salas y equipos.
						</p>

						<form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
							<Input
								id="email"
								label="Correo electrónico"
								type="email"
								autoComplete="email"
								placeholder="nombre@dcarv.com"
								className="w-full min-w-0"
								value={email}
								error={emailError}
								onChange={(event) => {
									setEmail(event.target.value);
									setEmailError('');
									setAuthError('');
								}}
							/>
							<div className="grid gap-2">
								<Input
									id="password"
									label="Contraseña"
									type="password"
									autoComplete="current-password"
									placeholder="Tu contraseña"
									className="w-full min-w-0"
									value={password}
									error={passwordError}
									onChange={(event) => {
										setPassword(event.target.value);
										setPasswordError('');
										setAuthError('');
									}}
								/>
								<div className="text-right">
									<a
										href="#"
										className="text-sm font-medium text-[var(--accent)] hover:underline"
										onClick={(event) => event.preventDefault()}
									>
										Olvidé mi contraseña
									</a>
								</div>
							</div>

							{authError ? (
								<p className="-mt-1 text-sm text-[#bd4a36]" role="alert">
									{authError}
								</p>
							) : null}

							<Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
								{isSubmitting ? 'Entrando...' : 'Entrar'}
							</Button>
						</form>
					</div>
				</Card>
				<p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
					Dcarv · Monitoreo de salas de computación
				</p>
			</Container>
		</main>
	);
}