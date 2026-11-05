import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buscarUsuarioPorEmail } from '@/lib/dataService';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { iniciarSesion } from './acceso';

vi.mock('@/lib/dataService', () => ({ buscarUsuarioPorEmail: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseAdminClient: vi.fn(), createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/auth/jwt', () => ({ createToken: vi.fn().mockResolvedValue('token-firmado') }));

const signInWithPassword = vi.fn();
const getUserById = vi.fn();
const updateUserById = vi.fn();
const perfil = { id: 'user-1', email: 'user@example.com', role: 'viewer' };
const consultaPerfil = { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
const sesionValida = { data: { user: { id: 'user-1' }, session: { access_token: 'acceso' } }, error: null };
const sinConfirmar = { data: { user: null, session: null }, error: { code: 'email_not_confirmed', status: 400 } };

describe('iniciarSesion', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		consultaPerfil.select.mockReturnValue(consultaPerfil);
		consultaPerfil.eq.mockReturnValue(consultaPerfil);
		consultaPerfil.single.mockResolvedValue({ data: perfil, error: null });
		vi.mocked(createSupabaseServerClient).mockReturnValue({
			auth: { signInWithPassword },
			from: vi.fn().mockReturnValue(consultaPerfil),
		} as unknown as ReturnType<typeof createSupabaseServerClient>);
		vi.mocked(createSupabaseAdminClient).mockReturnValue({
			auth: { admin: { getUserById, updateUserById } },
		} as unknown as ReturnType<typeof createSupabaseAdminClient>);
		vi.mocked(buscarUsuarioPorEmail).mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
		getUserById.mockResolvedValue({ data: { user: { id: 'user-1', email_confirmed_at: null } }, error: null });
		updateUserById.mockResolvedValue({ data: {}, error: null });
	});

	it('inicia sesión y firma el token con el perfil', async () => {
		signInWithPassword.mockResolvedValue(sesionValida);

		const resultado = await iniciarSesion('user@example.com', 'clave-segura');

		expect(resultado).toEqual({ ok: true, usuario: perfil, token: 'token-firmado' });
		expect(updateUserById).not.toHaveBeenCalled();
	});

	it('activa una cuenta que quedó sin confirmar y reintenta', async () => {
		signInWithPassword.mockResolvedValueOnce(sinConfirmar).mockResolvedValueOnce(sesionValida);

		const resultado = await iniciarSesion('user@example.com', 'clave-segura');

		expect(updateUserById).toHaveBeenCalledWith('user-1', { email_confirm: true });
		expect(signInWithPassword).toHaveBeenCalledTimes(2);
		expect(resultado.ok).toBe(true);
	});

	it('responde 401 con credenciales incorrectas, sin activar nada', async () => {
		signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { code: 'invalid_credentials', status: 400 } });

		const resultado = await iniciarSesion('user@example.com', 'mala');

		expect(resultado).toMatchObject({ ok: false, status: 401 });
		expect(updateUserById).not.toHaveBeenCalled();
	});

	it('responde 503 si Supabase falla', async () => {
		signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { status: 500 } });

		expect(await iniciarSesion('user@example.com', 'clave-segura')).toMatchObject({ ok: false, status: 503 });
	});
});
