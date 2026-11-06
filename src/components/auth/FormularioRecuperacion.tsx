'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CLASES_ENLACE_DORADO } from '@/components/auth/MarcoAcceso';
import { Icono } from '@/components/ui/Icono';
import { Boton } from '@/components/ui/Boton';
import { Input } from '@/components/ui/input';

// Espera antes de permitir otro envío (el servidor además limita a 3 solicitudes cada 15 minutos).
const ESPERA_REENVIO = 60;

export function FormularioRecuperacion({ emailInicial }: { emailInicial: string }) {
	const [email, setEmail] = useState(emailInicial);
	const [error, setError] = useState('');
	const [enviadoA, setEnviadoA] = useState('');
	const [espera, setEspera] = useState(0);
	const [procesando, setProcesando] = useState(false);

	useEffect(() => {
		if (espera <= 0) return;
		const reloj = setTimeout(() => setEspera((s) => s - 1), 1000);
		return () => clearTimeout(reloj);
	}, [espera]);

	async function solicitar(correo: string) {
		setError('');
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
			setError('Ingresa un correo electrónico válido.');
			return;
		}
		setProcesando(true);
		try {
			const respuesta = await fetch('/api/auth/recuperar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: correo }),
			});
			const resultado = (await respuesta.json().catch(() => ({}))) as { error?: string };
			if (!respuesta.ok) throw new Error(resultado.error || 'Ingresa un correo electrónico válido.');
			setEnviadoA(correo);
			setEspera(ESPERA_REENVIO);
		} catch (errorCapturado) {
			setError(errorCapturado instanceof Error ? errorCapturado.message : 'No se pudo procesar la solicitud.');
		} finally {
			setProcesando(false);
		}
	}

	function enviarSolicitud(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		void solicitar(email.trim());
	}

	if (enviadoA) {
		// La respuesta es la misma exista o no la cuenta: no se revela qué correos están registrados.
		return (
			<div className="mt-8 grid gap-5" role="status">
				<div className="flex items-start gap-3 rounded-xl border border-funcional/30 bg-funcional/10 p-4">
					<span className="grid size-9 shrink-0 place-items-center rounded-full bg-funcional/15 text-funcional">
						<Icono nombre="correo" className="size-4" />
					</span>
					<p className="text-sm leading-relaxed text-texto">
						Si <strong className="font-semibold break-all">{enviadoA}</strong> tiene una cuenta, le enviamos un
						enlace para crear una contraseña nueva.
					</p>
				</div>
				<ul className="grid gap-2 text-sm text-texto-suave">
					<li className="flex gap-2"><Icono nombre="reloj" className="mt-0.5 size-4" /> El enlace vence en 30 minutos y sirve una sola vez.</li>
					<li className="flex gap-2"><Icono nombre="buscar" className="mt-0.5 size-4" /> Si no lo ves en unos minutos, revisa la carpeta de correo no deseado.</li>
					<li className="flex gap-2"><Icono nombre="escudo" className="mt-0.5 size-4" /> Si sigue sin llegar, pide ayuda al administrador del sistema.</li>
				</ul>
				{error ? <p role="alert" className="text-sm text-baja">{error}</p> : null}
				<div className="grid gap-3 sm:grid-cols-2">
					<Boton
						type="button"
						variante="secundario"
						tamano="grande"
						cargando={procesando}
						disabled={espera > 0}
						onClick={() => void solicitar(enviadoA)}
					>
						{espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar enlace'}
					</Boton>
					<Boton type="button" variante="fantasma" tamano="grande" onClick={() => { setEnviadoA(''); setError(''); }}>
						Usar otro correo
					</Boton>
				</div>
				<p className="text-center text-sm lg:text-left">
					<Link href="/login" className={CLASES_ENLACE_DORADO}>Volver al inicio de sesión</Link>
				</p>
			</div>
		);
	}

	return (
		<>
			<form className="mt-8 grid gap-5" onSubmit={enviarSolicitud} noValidate>
				<Input
					id="email-recuperacion"
					label="Correo electrónico"
					type="email"
					autoComplete="email"
					placeholder="nombre@dcarv.com"
					autoFocus={!emailInicial}
					value={email}
					error={error || undefined}
					onChange={(evento) => {
						setEmail(evento.target.value);
						setError('');
					}}
				/>
				<Boton type="submit" tamano="grande" className="w-full" cargando={procesando}>
					{procesando ? 'Enviando…' : 'Enviar enlace'}
				</Boton>
			</form>
			<p className="mt-5 text-center text-sm lg:text-left">
				<Link href="/login" className={CLASES_ENLACE_DORADO}>Volver al inicio de sesión</Link>
			</p>
		</>
	);
}
