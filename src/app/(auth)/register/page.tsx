'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CampoContrasena } from '@/components/auth/CampoContrasena';
import { CLASES_ENLACE_DORADO, MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { MedidorContrasena } from '@/components/auth/MedidorContrasena';
import { Icono } from '@/components/ui/Icono';
import { DOMINIOS_SOPORTE, esRolValido, inicioPara, puedeSolicitarSoporte } from '@/lib/auth/permisos';
import { rutaSegura } from '@/lib/auth/redireccion';
import { LONGITUD_MINIMA_CONTRASENA } from '@/lib/reglas/contrasena';
import { Boton } from '@/components/ui/Boton';
import { Input } from '@/components/ui/input';

type Errores = { email?: string | undefined; password?: string | undefined; confirmacion?: string | undefined };

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmacion, setConfirmacion] = useState('');
	const [errores, setErrores] = useState<Errores>({});
	const [errorGeneral, setErrorGeneral] = useState<{ texto: string; cuentaExiste: boolean } | null>(null);
	const [creada, setCreada] = useState(false);
	const [enviando, setEnviando] = useState(false);
	// A dónde volver después de registrarse (p. ej. el reporte de un equipo abierto desde su QR).
	const [siguiente, setSiguiente] = useState<string | null>(null);
	useEffect(() => {
		setSiguiente(new URLSearchParams(window.location.search).get('siguiente'));
	}, []);

	function validar(): Errores {
		const correo = email.trim();
		const siguientes: Errores = {};
		if (!correo) siguientes.email = 'Ingresa tu correo electrónico.';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) siguientes.email = 'Ingresa un correo electrónico válido.';
		if ([...password].length < LONGITUD_MINIMA_CONTRASENA) {
			siguientes.password = `La contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`;
		}
		if (!confirmacion) siguientes.confirmacion = 'Repite la contraseña.';
		else if (confirmacion !== password) siguientes.confirmacion = 'Las contraseñas no coinciden.';
		return siguientes;
	}

	async function enviar(evento: FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setErrorGeneral(null);
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
				code?: string;
				data?: { sesionIniciada?: boolean; rol?: string };
			};
			if (!respuesta.ok) {
				setErrorGeneral({
					texto: resultado.error || 'No se pudo crear la cuenta. Inténtalo de nuevo.',
					cuentaExiste: resultado.code === 'EMAIL_EXISTS',
				});
				return;
			}
			// La cuenta queda activa al instante y con la sesión iniciada: no hay correo que esperar.
			if (resultado.data?.sesionIniciada) {
				const rol = esRolValido(resultado.data.rol) ? resultado.data.rol : 'viewer';
				router.replace(siguiente ? rutaSegura(siguiente) : inicioPara(rol));
				router.refresh();
				return;
			}
			setCreada(true);
		} catch {
			setErrorGeneral({ texto: 'No hay conexión con el servidor. Inténtalo de nuevo.', cuentaExiste: false });
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

	const coinciden = Boolean(confirmacion) && confirmacion === password;
	const correoLimpio = email.trim();
	// Se avisa antes de crearla qué tipo de cuenta será. El correo no se verifica, así que el dominio
	// institucional no da permisos por sí solo: abre una solicitud que aprueba un administrador.
	const tipoCuenta = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)
		? puedeSolicitarSoporte(correoLimpio)
			? 'Podrás reportar fallas desde ya. Tu acceso de soporte quedará pendiente hasta que un administrador lo apruebe.'
			: `Cuenta de reporte: podrás reportar fallas y seguir tus casos. Las cuentas de soporte usan un correo @${DOMINIOS_SOPORTE[0]}.`
		: undefined;

	return (
		<MarcoAcceso
			etiqueta="Nueva cuenta"
			titulo="Crear cuenta"
			descripcion={`Tu cuenta sirve para reportar fallas de los equipos y seguir tus casos. Con un correo @${DOMINIOS_SOPORTE[0]} además pides entrar al equipo de soporte; un administrador lo aprueba.`}
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
					autoFocus
					value={email}
					error={errores.email}
					helperText={tipoCuenta}
					onChange={(evento) => {
						setEmail(evento.target.value);
						setErrores((actual) => ({ ...actual, email: undefined }));
						setErrorGeneral(null);
					}}
				/>
				<CampoContrasena
					id="password"
					label="Contraseña"
					autoComplete="new-password"
					placeholder={`Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres`}
					value={password}
					error={errores.password}
					onChange={(evento) => {
						setPassword(evento.target.value);
						setErrores((actual) => ({ ...actual, password: undefined }));
					}}
				>
					<MedidorContrasena clave={password} email={correoLimpio} />
				</CampoContrasena>
				<CampoContrasena
					id="confirmacion"
					label="Confirmar contraseña"
					autoComplete="new-password"
					placeholder="Repite la contraseña"
					value={confirmacion}
					error={errores.confirmacion}
					onChange={(evento) => {
						setConfirmacion(evento.target.value);
						setErrores((actual) => ({ ...actual, confirmacion: undefined }));
					}}
				>
					{coinciden && !errores.confirmacion ? (
						<span className="flex items-center gap-1.5 text-xs text-funcional">
							<Icono nombre="check" className="size-3.5" /> Las contraseñas coinciden.
						</span>
					) : null}
				</CampoContrasena>

				{errorGeneral ? (
					<div className="-mt-1 rounded-lg border border-baja/30 bg-baja/10 px-3.5 py-2.5 text-sm text-baja" role="alert">
						{errorGeneral.texto}
						{errorGeneral.cuentaExiste ? (
							<span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
								<Link href="/login" className={CLASES_ENLACE_DORADO}>
									Iniciar sesión
								</Link>
								<Link
									href={`/recuperar-contrasena?email=${encodeURIComponent(correoLimpio)}`}
									className={CLASES_ENLACE_DORADO}
								>
									Recuperar contraseña
								</Link>
							</span>
						) : null}
					</div>
				) : null}

				<Boton type="submit" tamano="grande" className="mt-1 w-full" cargando={enviando}>
					{enviando ? 'Creando cuenta…' : 'Crear cuenta'}
				</Boton>
			</form>
		</MarcoAcceso>
	);
}
