import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { getSession } from '@/lib/auth/session';

export default async function ChangePasswordPage() {
	const session = await getSession();
	if (!session) redirect('/login');

	return (
		<main className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8 md:py-10">
			<header className="border-b border-[var(--line)] pb-6">
				<p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Cuenta</p>
				<h1 className="mt-2 text-3xl font-bold">Cambiar contraseña</h1>
				<p className="mt-2 text-sm text-[var(--text-secondary)]">Actualiza la contraseña de tu cuenta.</p>
			</header>
			<ChangePasswordForm email={session.email} />
		</main>
	);
}