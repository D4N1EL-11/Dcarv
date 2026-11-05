import Link from 'next/link';
import { CLASES_ENLACE_DORADO, MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { FormularioRestablecimiento } from '@/components/auth/FormularioRestablecimiento';

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function RestablecerContrasenaPage({ searchParams }: Props) {
	const parametros = await searchParams;
	const token = typeof parametros.token === 'string' ? parametros.token : '';

	return (
		<MarcoAcceso etiqueta="Recuperación de cuenta" titulo="Crear contraseña nueva">
			{token ? (
				<FormularioRestablecimiento token={token} />
			) : (
				<div className="mt-8 grid gap-4">
					<p role="alert" className="text-sm text-baja">El enlace no es válido o ya venció.</p>
					<Link href="/recuperar-contrasena" className={CLASES_ENLACE_DORADO}>Solicitar un enlace nuevo</Link>
				</div>
			)}
		</MarcoAcceso>
	);
}
