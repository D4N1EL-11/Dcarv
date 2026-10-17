import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { FormularioPruebaRestablecimiento } from '@/components/auth/FormularioPruebaRestablecimiento';

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

export default function ProbarRestablecimientoPage() {
	if (process.env.NODE_ENV !== 'development') notFound();

	return (
		<main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] py-10 text-[var(--text-primary)]" style={temaAutenticacion}>
			<Container maxWidth="sm" className="animate-float-in">
				<Card className="mx-auto w-full max-w-md overflow-hidden p-0 shadow-xl shadow-[#172033]/10">
					<div className="h-1.5 bg-[var(--accent)]" />
					<div className="p-6 sm:p-9">
						<p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Herramienta local</p>
						<h1 className="mt-2 text-3xl font-black">Probar restablecimiento</h1>
						<p className="mt-2 text-sm text-[var(--text-secondary)]">Genera un enlace local sin enviar correo y prueba el cambio real de contraseña.</p>
						<FormularioPruebaRestablecimiento />
					</div>
				</Card>
			</Container>
		</main>
	);
}