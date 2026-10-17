import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession } from '@/lib/auth/session';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import type { SessionPayload } from '@/lib/auth/jwt';
import { POST } from './route';

vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createSupabaseAdminClient: vi.fn(), createSupabaseServerClient: vi.fn() }));

const signInWithPassword = vi.fn();
const updateUser = vi.fn();
const profileQuery = {
	select: vi.fn(),
	eq: vi.fn(),
	maybeSingle: vi.fn(),
};
profileQuery.select.mockReturnValue(profileQuery);
profileQuery.eq.mockReturnValue(profileQuery);

function createRequest(body: unknown) {
	return new Request('http://localhost/api/auth/change-password', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('POST /api/auth/change-password', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', email: 'user@example.com', role: 'viewer' } as SessionPayload);
		profileQuery.select.mockReturnValue(profileQuery);
		profileQuery.eq.mockReturnValue(profileQuery);
		profileQuery.maybeSingle.mockResolvedValue({ data: { id: 'user-1', email: 'user@example.com' }, error: null });
		vi.mocked(createSupabaseAdminClient).mockReturnValue({
			from: vi.fn().mockReturnValue(profileQuery),
		} as unknown as ReturnType<typeof createSupabaseAdminClient>);
		signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
		updateUser.mockResolvedValue({ error: null });
		vi.mocked(createSupabaseServerClient).mockReturnValue({
			auth: { signInWithPassword, updateUser },
		} as unknown as ReturnType<typeof createSupabaseServerClient>);
	});

	it.each(['viewer', 'editor', 'admin'] as const)('permite cambiar la contraseña al rol %s', async (role) => {
		vi.mocked(getSession).mockResolvedValue({ userId: 'user-1', email: 'user@example.com', role } as SessionPayload);
		const response = await POST(createRequest({ email: 'user@example.com', currentPassword: 'current-pass', newPassword: 'new-password' }));

		expect(response.status).toBe(200);
		expect(profileQuery.eq).toHaveBeenNthCalledWith(1, 'id', 'user-1');
		expect(signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'current-pass' });
		expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' });
	});

	it('permite reemplazar la contraseña varias veces usando la nueva como actual', async () => {
		const firstResponse = await POST(createRequest({ email: 'user@example.com', currentPassword: 'old-password', newPassword: 'new-password' }));
		const secondResponse = await POST(createRequest({ email: 'user@example.com', currentPassword: 'new-password', newPassword: 'latest-password' }));

		expect(firstResponse.status).toBe(200);
		expect(secondResponse.status).toBe(200);
		expect(signInWithPassword).toHaveBeenNthCalledWith(1, { email: 'user@example.com', password: 'old-password' });
		expect(signInWithPassword).toHaveBeenNthCalledWith(2, { email: 'user@example.com', password: 'new-password' });
		expect(updateUser).toHaveBeenNthCalledWith(1, { password: 'new-password' });
		expect(updateUser).toHaveBeenNthCalledWith(2, { password: 'latest-password' });
	});

	it('rechaza la contraseña actual incorrecta sin actualizar', async () => {
		signInWithPassword.mockResolvedValue({ data: { user: null }, error: { status: 400 } });

		const response = await POST(createRequest({ email: 'user@example.com', currentPassword: 'wrong-pass', newPassword: 'new-password' }));

		expect(response.status).toBe(400);
		expect(updateUser).not.toHaveBeenCalled();
	});

	it('deniega el cambio cuando el correo no tiene perfil en la base de datos', async () => {
		profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

		const response = await POST(createRequest({ email: 'unknown@example.com', currentPassword: 'current-pass', newPassword: 'new-password' }));

		expect(response.status).toBe(403);
		expect((await response.json()).code).toBe('USER_NOT_FOUND');
		expect(signInWithPassword).not.toHaveBeenCalled();
		expect(updateUser).not.toHaveBeenCalled();
	});

	it('deniega un correo registrado que no pertenece a la sesión actual', async () => {
		const response = await POST(createRequest({ email: 'other@example.com', currentPassword: 'current-pass', newPassword: 'new-password' }));

		expect(response.status).toBe(403);
		expect(signInWithPassword).not.toHaveBeenCalled();
		expect(updateUser).not.toHaveBeenCalled();
	});

	it('requiere una sesión autenticada', async () => {
		vi.mocked(getSession).mockResolvedValue(null);

		const response = await POST(createRequest({ email: 'user@example.com', currentPassword: 'current-pass', newPassword: 'new-password' }));

		expect(response.status).toBe(401);
		expect(createSupabaseAdminClient).not.toHaveBeenCalled();
		expect(createSupabaseServerClient).not.toHaveBeenCalled();
	});
});