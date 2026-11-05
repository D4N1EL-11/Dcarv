import { notFound } from 'next/navigation';
import { MarcoAcceso } from '@/components/auth/MarcoAcceso';
import { FormularioPruebaRestablecimiento } from '@/components/auth/FormularioPruebaRestablecimiento';

export default function ProbarRestablecimientoPage() {
	if (process.env.NODE_ENV !== 'development') notFound();

	return (
		<MarcoAcceso
			etiqueta="Herramienta local"
			titulo="Probar restablecimiento"
			descripcion="Genera un enlace local sin enviar correo y prueba el cambio real de contraseña."
		>
			<FormularioPruebaRestablecimiento />
		</MarcoAcceso>
	);
}
