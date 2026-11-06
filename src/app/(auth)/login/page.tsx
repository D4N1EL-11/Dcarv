'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CampoContrasena } from '@/components/auth/CampoContrasena';
import { CLASES_ENLACE_DORADO, MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { esRolValido, inicioPara } from '@/lib/auth/permisos';
import { rutaSegura } from '@/lib/auth/redireccion';
import { Boton } from '@/components/ui/Boton';
import { Input } from '@/components/ui/input';

// Tras varios fallos seguidos el servidor hace esperar (lib/reglas/acceso.ts): se avisa antes.
function mensajeCredenciales(restantes: number | null | undefined, minutos = 15): string {
	const base = 'Correo o contraseña incorrectos.';
	if (typeof restantes !== 'number' || restantes > 2) return base;
	if (restantes === 0) return `${base} Por seguridad, espera ${minutos} minutos antes de intentarlo de nuevo.`;
	return `${base} ${restantes === 1 ? 'Te queda 1 intento' : `Te quedan ${restantes} intentos`} antes de una espera de ${minutos} minutos.`;
}

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [authError, setAuthError] = useState('');
	const [restablecimientoAviso, setRestablecimientoAviso] = useState(false);
	const [sesionExpirada, setSesionExpirada] = useState(false);
	// Ruta pedida antes de iniciar sesión (?siguiente=); sin ella, el inicio de cada rol.
	const [siguiente, setSiguiente] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	useEffect(() => {
		const parametros = new URLSearchParams(window.location.search);
		setRestablecimientoAviso(parametros.get('restablecida') === '1');
		setSesionExpirada(parametros.get('expirada') === '1');
		setSiguiente(parametros.get('siguiente'));
	}, []);

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
			const result = (await response.json()) as {
				error?: string;
				data?: { role?: string };
				intentosRestantes?: number | null;
				minutosBloqueo?: number;
			};
			if (!response.ok) {
				setAuthError(
					response.status === 401
						? mensajeCredenciales(result.intentosRestantes, result.minutosBloqueo)
						: result.error || 'No se pudo iniciar sesión. Inténtalo de nuevo.',
				);
				return;
			}
			const rol = esRolValido(result.data?.role) ? result.data.role : 'viewer';
			router.replace(siguiente ? rutaSegura(siguiente) : inicioPara(rol));
			router.refresh();
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<MarcoAcceso
			etiqueta="Acceso al sistema"
			titulo="Bienvenido de nuevo"
			descripcion="Inicia sesión para revisar tus salas y equipos."
			pie={
				<>
					¿Aún no tienes cuenta?{' '}
					<Link
						href={siguiente ? `/register?siguiente=${encodeURIComponent(siguiente)}` : '/register'}
						className={CLASES_ENLACE_DORADO}
					>
						Crear cuenta
					</Link>
				</>
			}
		>
			{sesionExpirada ? (
				<p role="status" className="mt-6 rounded-lg border border-reparacion/30 bg-reparacion/10 px-4 py-3 text-sm text-reparacion">
					Tu sesión expiró. Inicia sesión de nuevo para continuar donde estabas.
				</p>
			) : null}
			{restablecimientoAviso ? (
				<p role="status" className="mt-6 rounded-lg border border-funcional/30 bg-funcional/10 px-4 py-3 text-sm text-funcional">
					La contraseña se restableció correctamente. Inicia sesión con tu nueva contraseña.
				</p>
			) : null}

			<form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
				<Input
					id="email"
					label="Correo electrónico"
					type="email"
					autoComplete="email"
					placeholder="nombre@dcarv.com"
					className="w-full min-w-0"
					autoFocus
					value={email}
					error={emailError}
					onChange={(event) => {
						setEmail(event.target.value);
						setEmailError('');
						setAuthError('');
					}}
				/>
				<div className="grid gap-2">
					<CampoContrasena
						id="password"
						label="Contraseña"
						autoComplete="current-password"
						placeholder="Tu contraseña"
						value={password}
						error={passwordError}
						onChange={(event) => {
							setPassword(event.target.value);
							setPasswordError('');
							setAuthError('');
						}}
					/>
					<div className="text-right">
						<Link
							href={email.trim() ? `/recuperar-contrasena?email=${encodeURIComponent(email.trim())}` : '/recuperar-contrasena'}
							className={`text-xs ${CLASES_ENLACE_DORADO}`}
						>
							¿Olvidaste tu contraseña?
						</Link>
					</div>
				</div>

				{authError ? (
					<p className="-mt-1 rounded-lg border border-baja/30 bg-baja/10 px-3.5 py-2.5 text-sm text-baja" role="alert">
						{authError}
					</p>
				) : null}

				<Boton type="submit" tamano="grande" className="mt-1 w-full" cargando={isSubmitting}>
					{isSubmitting ? 'Entrando…' : 'Entrar'}
				</Boton>
			</form>
		</MarcoAcceso>
	);
}
