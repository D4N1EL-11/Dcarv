import { MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { FormularioRecuperacion } from '@/components/auth/FormularioRecuperacion';

type Props = { searchParams: Promise<{ email?: string | string[] }> };

export default async function RecuperarContrasenaPage({ searchParams }: Props) {
	const parametros = await searchParams;
	const email = typeof parametros.email === 'string' ? parametros.email : '';

	return (
		<MarcoAcceso
			etiqueta="Recuperación de cuenta"
			titulo="Restablecer contraseña"
			descripcion="Ingresa tu correo y te enviaremos un enlace de un solo uso."
		>
			<FormularioRecuperacion emailInicial={email} />
		</MarcoAcceso>
	);
}
