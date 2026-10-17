import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buscarUsuarioPorEmail,
	contarSolicitudesRestablecimiento,
	crearTokenRestablecimiento,
	invalidarTokensPendientes,
} from '@/lib/dataService';
import { enviarCorreo } from '@/lib/correo';
import { calcularHashToken, generarToken } from '@/lib/tokenRecuperacion';
import { obtenerUrlBase } from '@/lib/urlBase';
import { POST } from './route';

vi.mock('@/lib/dataService', () => ({
	buscarUsuarioPorEmail: vi.fn(),
	contarSolicitudesRestablecimiento: vi.fn(),
	crearTokenRestablecimiento: vi.fn(),
	invalidarTokensPendientes: vi.fn(),
}));
vi.mock('@/lib/correo', () => ({ enviarCorreo: vi.fn() }));
vi.mock('@/lib/tokenRecuperacion', () => ({ calcularHashToken: vi.fn(), generarToken: vi.fn() }));
vi.mock('@/lib/urlBase', () => ({ obtenerUrlBase: vi.fn() }));

const token = 'a'.repeat(64);

function crearRequest(body: unknown) {
	return new Request('http://localhost/api/auth/recuperar', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('POST /api/auth/recuperar', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(buscarUsuarioPorEmail).mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
		vi.mocked(contarSolicitudesRestablecimiento).mockResolvedValue(0);
		vi.mocked(invalidarTokensPendientes).mockResolvedValue();
		vi.mocked(crearTokenRestablecimiento).mockResolvedValue();
		vi.mocked(generarToken).mockReturnValue(token);
		vi.mocked(calcularHashToken).mockReturnValue('hash-seguro');
		vi.mocked(obtenerUrlBase).mockReturnValue('https://dcarv.example');
		vi.mocked(enviarCorreo).mockResolvedValue({ ok: false, error: 'correo no disponible' });
	});

	it('guarda solo el hash y responde igual aunque falle el envío', async () => {
		const antes = Date.now();
		const response = await POST(crearRequest({ email: ' USER@example.com ' }));
		const despues = Date.now();

		expect(response.status).toBe(200);
		expect((await response.json()).message).toBe('Si el correo está registrado, recibirás un enlace para restablecer la contraseña.');
		expect(crearTokenRestablecimiento).toHaveBeenCalledWith('user-1', 'hash-seguro', expect.any(String));
		const llamadaToken = vi.mocked(crearTokenRestablecimiento).mock.calls[0];
		expect(llamadaToken).toBeDefined();
		const expiraEn = Date.parse(llamadaToken?.[2] ?? '');
		expect(expiraEn).toBeGreaterThanOrEqual(antes + 30 * 60 * 1000);
		expect(expiraEn).toBeLessThanOrEqual(despues + 30 * 60 * 1000);
		expect(enviarCorreo).toHaveBeenCalledWith(expect.objectContaining({
			para: 'user@example.com',
			asunto: 'Restablecer contraseña',
			html: expect.stringContaining(`https://dcarv.example/restablecer-contrasena?token=${token}`),
		}));
	});

	it('devuelve el mensaje genérico y no envía correo si no existe el usuario', async () => {
		vi.mocked(buscarUsuarioPorEmail).mockResolvedValue(null);

		const response = await POST(crearRequest({ email: 'unknown@example.com' }));

		expect(response.status).toBe(200);
		expect(enviarCorreo).not.toHaveBeenCalled();
		expect(crearTokenRestablecimiento).not.toHaveBeenCalled();
	});

	it('no supera tres solicitudes en quince minutos', async () => {
		vi.mocked(contarSolicitudesRestablecimiento).mockResolvedValue(3);

		const response = await POST(crearRequest({ email: 'user@example.com' }));

		expect(response.status).toBe(200);
		expect(enviarCorreo).not.toHaveBeenCalled();
		expect(crearTokenRestablecimiento).not.toHaveBeenCalled();
	});

	it('devuelve un enlace local solo en desarrollo y no envía correo', async () => {
		vi.stubEnv('NODE_ENV', 'development');

		const response = await POST(crearRequest({ email: 'user@example.com', modoPrueba: true }));
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.enlacePrueba).toMatch(/^\/restablecer-contrasena\?token=[a-f\d]{64}$/);
		expect(enviarCorreo).not.toHaveBeenCalled();
	});

	it('no expone el enlace de prueba fuera de desarrollo', async () => {
		vi.stubEnv('NODE_ENV', 'production');

		const response = await POST(crearRequest({ email: 'user@example.com', modoPrueba: true }));
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.enlacePrueba).toBeUndefined();
		expect(enviarCorreo).toHaveBeenCalledOnce();
	});
});