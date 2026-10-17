import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { FormularioRestablecimiento } from '@/components/auth/FormularioRestablecimiento';

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

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function RestablecerContrasenaPage({ searchParams }: Props) {
	const parametros = await searchParams;
	const token = typeof parametros.token === 'string' ? parametros.token : '';

	return (
		<main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] py-10 text-[var(--text-primary)]" style={temaAutenticacion}>
			<Container maxWidth="sm" className="animate-float-in">
				<Card className="mx-auto w-full max-w-md overflow-hidden p-0 shadow-xl shadow-[#172033]/10">
					<div className="h-1.5 bg-[var(--accent)]" />
					<div className="p-6 sm:p-9">
						<p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Recuperación de cuenta</p>
						<h1 className="mt-2 text-3xl font-black">Crear contraseña nueva</h1>
						{token ? <FormularioRestablecimiento token={token} /> : (
							<div className="mt-8 grid gap-4">
								<p role="alert" className="text-sm text-[#bd4a36]">El enlace no es válido o ya venció.</p>
								<Link href="/recuperar-contrasena" className="font-medium text-[var(--accent)] hover:underline">Solicitar un enlace nuevo</Link>
							</div>
						)}
					</div>
				</Card>
			</Container>
		</main>
	);
}