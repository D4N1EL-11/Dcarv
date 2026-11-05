import Link from 'next/link';
import { CLASES_ENLACE_DORADO, MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { FormularioRestablecimiento } from '@/components/auth/FormularioRestablecimiento';

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function RestablecerContrasenaPage({ searchParams }: Props) {
	const parametros = await searchParams;
	const token = typeof parametros.token === 'string' ? parametros.token : '';

	return (
		<MarcoAcceso
			etiqueta="Recuperación de cuenta"
			titulo="Crear contraseña nueva"
			descripcion={token ? 'Elige una contraseña que no uses en otros sitios. Al guardarla, inicia sesión con ella.' : undefined}
		>
			{token ? (
				<FormularioRestablecimiento token={token} />
			) : (
				<div className="mt-8 grid gap-4">
					<p role="alert" className="rounded-lg border border-baja/30 bg-baja/10 px-3.5 py-2.5 text-sm text-baja">
						El enlace no es válido o ya venció. Los enlaces duran 30 minutos y sirven una sola vez.
					</p>
					<Link href="/recuperar-contrasena" className={CLASES_ENLACE_DORADO}>Solicitar un enlace nuevo</Link>
				</div>
			)}
		</MarcoAcceso>
	);
}
