'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type UserRole = 'admin' | 'editor' | 'viewer';
type User = {
	id: string;
	email: string;
	role: UserRole;
	created_at: string;
	updated_at: string;
};
type ApiResponse = { success?: boolean; data?: User[] | User; error?: string };
type FormValues = { email: string; password: string; role: UserRole };

const emptyForm: FormValues = { email: '', password: '', role: 'viewer' };
const roleLabels: Record<UserRole, string> = { admin: 'Administrador', editor: 'Editor', viewer: 'Lector' };

async function readResponse(response: Response): Promise<ApiResponse> {
	return response.json() as Promise<ApiResponse>;
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [query, setQuery] = useState('');
	const [form, setForm] = useState<FormValues>(emptyForm);
	const [editing, setEditing] = useState<User | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [forbidden, setForbidden] = useState(false);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');

	async function loadUsers() {
		setLoading(true);
		setError('');
		try {
			const response = await fetch('/api/admin/users', { cache: 'no-store' });
			const result = await readResponse(response);
			if (response.status === 401 || response.status === 403) {
				setForbidden(true);
				return;
			}
			if (!response.ok || !Array.isArray(result.data)) throw new Error(result.error || 'No se pudieron cargar los usuarios.');
			setForbidden(false);
			setUsers(result.data);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los usuarios.');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadUsers();
	}, []);

	const normalizedQuery = query.trim().toLocaleLowerCase();
	const filteredUsers = normalizedQuery
		? users.filter((user) => user.email.toLocaleLowerCase().includes(normalizedQuery))
		: users;

	function openCreate() {
		setEditing(null);
		setForm(emptyForm);
		setError('');
		setDialogOpen(true);
	}

	function openEdit(user: User) {
		setEditing(user);
		setForm({ email: user.email, password: '', role: user.role });
		setError('');
		setDialogOpen(true);
	}

	async function submitUser(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError('');
		setNotice('');
		try {
			const response = editing
				? await fetch(`/api/admin/users/${editing.id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }),
					})
				: await fetch('/api/admin/users', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(form),
					});
			const result = await readResponse(response);
			if (!response.ok) throw new Error(result.error || 'No se pudo guardar el usuario.');
			setDialogOpen(false);
			setNotice(editing ? 'Usuario actualizado.' : 'Usuario creado.');
			await loadUsers();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'No se pudo guardar el usuario.');
		} finally {
			setSaving(false);
		}
	}

	if (forbidden) {
		return (
			<main className="mx-auto w-full max-w-5xl px-5 py-10">
				<p className="text-sm font-semibold uppercase text-[var(--accent)]">Administración</p>
				<h1 className="mt-2 text-3xl font-bold">Usuarios</h1>
				<p className="mt-4 max-w-xl text-sm text-[var(--text-secondary)]">Esta sección requiere una cuenta con rol de administrador. Cierra sesión y vuelve a entrar si acabas de recibir ese rol.</p>
			</main>
		);
	}

	return (
		<main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
			<header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
				<div>
					<p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Administración</p>
					<h1 className="mt-2 text-3xl font-bold">Usuarios</h1>
					<p className="mt-2 text-sm text-[var(--text-secondary)]">{users.length} cuentas registradas</p>
				</div>
				<Button type="button" onClick={openCreate}>Crear usuario</Button>
			</header>

			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] py-4">
				<Input id="user-search" aria-label="Buscar usuarios por email" placeholder="Buscar por email" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full max-w-sm" />
				<button type="button" className="text-sm font-semibold text-[var(--accent)] hover:underline" onClick={() => void loadUsers()}>Actualizar</button>
			</div>

			{notice ? <p role="status" className="border-b border-[var(--line)] py-3 text-sm text-emerald-700">{notice}</p> : null}
			{error && !dialogOpen ? <p role="alert" className="border-b border-[var(--line)] py-3 text-sm text-red-600">{error}</p> : null}

			<div className="overflow-x-auto">
				<table className="w-full table-fixed border-collapse text-left text-sm">
					<thead>
						<tr className="border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
							<th className="w-[48%] py-3 pr-2 font-semibold sm:w-auto sm:pr-4">Email</th>
							<th className="w-[25%] py-3 pr-2 font-semibold sm:w-auto sm:pr-4">Rol</th>
							<th className="hidden py-3 pr-4 font-semibold sm:table-cell">Creado</th>
							<th className="w-[27%] py-3 text-right font-semibold sm:w-auto">Acción</th>
						</tr>
					</thead>
					<tbody>
						{loading ? <tr><td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">Cargando usuarios...</td></tr> : null}
						{!loading && filteredUsers.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">{query ? 'No hay coincidencias.' : 'Todavía no hay usuarios.'}</td></tr> : null}
						{!loading ? filteredUsers.map((user) => (
							<tr key={user.id} className="border-b border-[var(--line)] last:border-0">
								<td className="break-all py-4 pr-2 text-xs font-medium sm:pr-4 sm:text-sm">{user.email}</td>
								<td className="py-4 pr-2 sm:pr-4"><span className="inline-flex rounded-full border border-[var(--line)] px-1.5 py-1 text-[10px] sm:px-2.5 sm:text-xs">{user.role === 'admin' ? <><span className="sm:hidden">Admin</span><span className="hidden sm:inline">{roleLabels[user.role]}</span></> : roleLabels[user.role]}</span></td>
								<td className="hidden py-4 pr-4 text-[var(--text-secondary)] sm:table-cell">{new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(user.created_at))}</td>
								<td className="py-4 text-right"><Button type="button" variant="ghost" size="sm" aria-label={`Editar ${user.email}`} onClick={() => openEdit(user)}>Editar</Button></td>
							</tr>
						)) : null}
					</tbody>
				</table>
			</div>

			{dialogOpen ? (
				<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}>
					<section role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="w-full max-w-lg border border-[var(--line)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
						<div className="mb-5 flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Cuenta</p>
								<h2 id="user-dialog-title" className="mt-1 text-xl font-semibold">{editing ? 'Editar usuario' : 'Crear usuario'}</h2>
							</div>
							<button type="button" aria-label="Cerrar" className="px-2 py-1 text-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setDialogOpen(false)}>×</button>
						</div>
						<form className="grid gap-4" onSubmit={submitUser}>
							<Input id="user-email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
							<Input id="user-password" label={editing ? 'Nueva contraseña' : 'Contraseña'} type="password" autoComplete="new-password" required={!editing} minLength={8} helperText={editing ? 'Déjala vacía para conservar la contraseña actual.' : 'Mínimo 8 caracteres.'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
							<label htmlFor="user-role" className="grid gap-1.5 text-sm font-medium">Rol<select id="user-role" className="rounded-lg border border-[var(--line)] bg-[var(--bg-secondary)] px-3 py-2.5 text-[var(--text-primary)]" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}><option value="viewer">Lector</option><option value="editor">Editor</option><option value="admin">Administrador</option></select></label>
							{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
							<div className="mt-2 flex justify-end gap-2 border-t border-[var(--line)] pt-4"><Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" loading={saving}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Button></div>
						</form>
					</section>
				</div>
			) : null}
		</main>
	);
}