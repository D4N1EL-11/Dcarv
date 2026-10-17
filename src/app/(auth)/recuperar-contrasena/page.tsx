import type { CSSProperties } from 'react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { FormularioRecuperacion } from '@/components/auth/FormularioRecuperacion';

const temaAutenticacion = {
	'--bg-primary': '#f3efe7',
	'--bg-secondary': '#fffdf8',
	'--text-primary': '#172033',
	'--text-secondary': '#657086',
	'--line': 'rgba(23, 32, 51, 0.15)',
	'--accent': '#e15f3d',
	'--accent-soft': 'rgba(225, 95, 61, 0.12)',
	fontFamily: "'Avenir Next', 'Segoe UI', sans-serif",
} as CSSProperties;

type Props = { searchParams: Promise<{ email?: string | string[] }> };

export default async function RecuperarContrasenaPage({ searchParams }: Props) {
	const parametros = await searchParams;
	const email = typeof parametros.email === 'string' ? parametros.email : '';

	return (
		<main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] py-10 text-[var(--text-primary)]" style={temaAutenticacion}>
			<Container maxWidth="sm" className="animate-float-in">
				<Card className="mx-auto w-full max-w-md overflow-hidden p-0 shadow-xl shadow-[#172033]/10">
					<div className="h-1.5 bg-[var(--accent)]" />
					<div className="p-6 sm:p-9">
						<p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Recuperación de cuenta</p>
						<h1 className="mt-2 text-3xl font-black">Restablecer contraseña</h1>
						<p className="mt-2 text-sm text-[var(--text-secondary)]">Ingresa tu correo y te enviaremos un enlace de un solo uso.</p>
						<FormularioRecuperacion emailInicial={email} />
					</div>
				</Card>
			</Container>
		</main>
	);
}