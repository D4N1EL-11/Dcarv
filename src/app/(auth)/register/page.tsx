'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CLASES_ENLACE_DORADO, MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { DESTINO_POR_DEFECTO } from '@/lib/auth/redireccion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Errores = { email?: string | undefined; password?: string | undefined; confirmacion?: string | undefined };

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmacion, setConfirmacion] = useState('');
	const [errores, setErrores] = useState<Errores>({});
	const [errorGeneral, setErrorGeneral] = useState('');
	const [creada, setCreada] = useState(false);
	const [enviando, setEnviando] = useState(false);

	function validar(): Errores {
		const correo = email.trim();
		const siguientes: Errores = {};
		if (!correo) siguientes.email = 'Ingresa tu correo electrónico.';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) siguientes.email = 'Ingresa un correo electrónico válido.';
		if (password.length < 8) siguientes.password = 'La contraseña debe tener al menos 8 caracteres.';
		if (!confirmacion) siguientes.confirmacion = 'Repite la contraseña.';
		else if (confirmacion !== password) siguientes.confirmacion = 'Las contraseñas no coinciden.';
		return siguientes;
	}

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setErrorGeneral('');
		const siguientes = validar();
		setErrores(siguientes);
		if (Object.keys(siguientes).length) return;

		setEnviando(true);
		try {
			const respuesta = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), password }),
			});
			const resultado = (await respuesta.json().catch(() => ({}))) as {
				error?: string;
				data?: { sesionIniciada?: boolean };
			};
			if (!respuesta.ok) {
				setErrorGeneral(resultado.error || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
				return;
			}
			// La cuenta queda activa al instante y con la sesión iniciada: no hay correo que esperar.
			if (resultado.data?.sesionIniciada) {
				router.replace(DESTINO_POR_DEFECTO);
				router.refresh();
				return;
			}
			setCreada(true);
		} catch {
			setErrorGeneral('No hay conexión con el servidor. Inténtalo de nuevo.');
		} finally {
			setEnviando(false);
		}
	}

	if (creada) {
		return (
			<MarcoAcceso
				etiqueta="Registro completado"
				titulo="Tu cuenta está lista"
				descripcion="Ya puedes iniciar sesión con tu correo y contraseña."
			>
				<Link
					href="/login"
					className="mt-8 flex w-full items-center justify-center rounded-lg bg-primario px-5 py-3 text-sm font-medium tracking-wide text-fondo transition hover:bg-primario-fuerte"
				>
					Ir a iniciar sesión
				</Link>
			</MarcoAcceso>
		);
	}

	return (
		<MarcoAcceso
			etiqueta="Nueva cuenta"
			titulo="Crear cuenta"
			descripcion="Regístrate para gestionar las salas, los equipos y sus incidencias."
			pie={
				<>
					¿Ya tienes cuenta?{' '}
					<Link href="/login" className={CLASES_ENLACE_DORADO}>
						Iniciar sesión
					</Link>
				</>
			}
		>
			<form className="mt-8 grid gap-5" onSubmit={enviar} noValidate>
				<Input
					id="email"
					label="Correo electrónico"
					type="email"
					autoComplete="email"
					placeholder="nombre@dcarv.com"
					value={email}
					error={errores.email}
					onChange={(evento) => {
						setEmail(evento.target.value);
						setErrores((actual) => ({ ...actual, email: undefined }));
					}}
				/>
				<Input
					id="password"
					label="Contraseña"
					type="password"
					autoComplete="new-password"
					placeholder="Mínimo 8 caracteres"
					value={password}
					error={errores.password}
					onChange={(evento) => {
						setPassword(evento.target.value);
						setErrores((actual) => ({ ...actual, password: undefined }));
					}}
				/>
				<Input
					id="confirmacion"
					label="Confirmar contraseña"
					type="password"
					autoComplete="new-password"
					placeholder="Repite la contraseña"
					value={confirmacion}
					error={errores.confirmacion}
					onChange={(evento) => {
						setConfirmacion(evento.target.value);
						setErrores((actual) => ({ ...actual, confirmacion: undefined }));
					}}
				/>

				{errorGeneral ? (
					<p className="-mt-1 text-sm text-baja" role="alert">
						{errorGeneral}
					</p>
				) : null}

				<Button type="submit" size="lg" className="mt-1 w-full" loading={enviando}>
					Crear cuenta
				</Button>
			</form>
		</MarcoAcceso>
	);
}
