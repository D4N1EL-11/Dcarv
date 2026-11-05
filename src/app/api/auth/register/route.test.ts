import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activarCuenta, buscarCuentaPendiente, iniciarSesion } from '@/lib/auth/acceso';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { POST } from './route';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/auth/acceso', async (original) => ({
	...(await original<typeof import('@/lib/auth/acceso')>()),
	activarCuenta: vi.fn(),
	buscarCuentaPendiente: vi.fn(),
	iniciarSesion: vi.fn(),
}));

const createUser = vi.fn();
const usuario = { id: 'user-1', email: 'nuevo@example.com', role: 'viewer' as const };

function crearRequest(body: unknown) {
	return new Request('http://localhost/api/auth/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('POST /api/auth/register', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(createSupabaseAdminClient).mockReturnValue({
			auth: { admin: { createUser } },
		} as unknown as ReturnType<typeof createSupabaseAdminClient>);
		createUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
		vi.mocked(iniciarSesion).mockResolvedValue({ ok: true, usuario, token: 'token-firmado' });
		vi.mocked(buscarCuentaPendiente).mockResolvedValue(null);
		vi.mocked(activarCuenta).mockResolvedValue();
	});

	it('crea la cuenta ya confirmada, sin correo, e inicia sesión', async () => {
		const response = await POST(crearRequest({ email: ' Nuevo@Example.com ', password: 'clave-segura' }));

		expect(response.status).toBe(201);
		expect(createUser).toHaveBeenCalledWith({ email: 'nuevo@example.com', password: 'clave-segura', email_confirm: true });
		expect(iniciarSesion).toHaveBeenCalledWith('nuevo@example.com', 'clave-segura');
		expect((await response.json()).data).toEqual({ ...usuario, sesionIniciada: true });
		expect(response.cookies.get('dcarv_session')?.value).toBe('token-firmado');
	});

	it('activa con la contraseña nueva una cuenta que quedó esperando el correo de confirmación', async () => {
		createUser.mockResolvedValue({ data: { user: null }, error: { code: 'email_exists', status: 422 } });
		vi.mocked(buscarCuentaPendiente).mockResolvedValue('user-pendiente');

		const response = await POST(crearRequest({ email: 'nuevo@example.com', password: 'otra-clave' }));

		expect(response.status).toBe(201);
		expect(activarCuenta).toHaveBeenCalledWith('user-pendiente', 'otra-clave');
		expect(iniciarSesion).toHaveBeenCalledWith('nuevo@example.com', 'otra-clave');
	});

	it('no toca una cuenta ya activa con el mismo correo', async () => {
		createUser.mockResolvedValue({ data: { user: null }, error: { code: 'email_exists', status: 422 } });

		const response = await POST(crearRequest({ email: 'nuevo@example.com', password: 'otra-clave' }));

		expect(response.status).toBe(409);
		expect((await response.json()).code).toBe('EMAIL_EXISTS');
		expect(activarCuenta).not.toHaveBeenCalled();
		expect(iniciarSesion).not.toHaveBeenCalled();
	});

	it('rechaza datos inválidos sin llamar a Supabase', async () => {
		const response = await POST(crearRequest({ email: 'no-es-correo', password: 'corta' }));

		expect(response.status).toBe(400);
		expect(createUser).not.toHaveBeenCalled();
	});

	it('responde 201 sin sesión si la cuenta se creó pero no se pudo iniciar sesión', async () => {
		vi.mocked(iniciarSesion).mockResolvedValue({ ok: false, status: 503, error: 'x', code: 'AUTH_UNAVAILABLE' });

		const response = await POST(crearRequest({ email: 'nuevo@example.com', password: 'clave-segura' }));

		expect(response.status).toBe(201);
		expect((await response.json()).data).toEqual({ sesionIniciada: false });
		expect(response.cookies.get('dcarv_session')).toBeUndefined();
	});
});
