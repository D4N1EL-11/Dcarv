import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	actualizarContrasenaUsuario,
	buscarTokenVigente,
	invalidarTokensPendientes,
	marcarTokenComoUsado,
} from '@/lib/dataService';
import { calcularHashToken } from '@/lib/tokenRecuperacion';
import { POST } from './route';

vi.mock('@/lib/dataService', () => ({
	actualizarContrasenaUsuario: vi.fn(),
	buscarTokenVigente: vi.fn(),
	invalidarTokensPendientes: vi.fn(),
	marcarTokenComoUsado: vi.fn(),
}));
vi.mock('@/lib/tokenRecuperacion', () => ({ calcularHashToken: vi.fn() }));

const token = 'a'.repeat(64);

function crearRequest(body: unknown) {
	return new Request('http://localhost/api/auth/restablecer', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

describe('POST /api/auth/restablecer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(calcularHashToken).mockReturnValue('hash-seguro');
		vi.mocked(buscarTokenVigente).mockResolvedValue({ id: 'token-1', usuario_id: 'user-1' });
		vi.mocked(actualizarContrasenaUsuario).mockResolvedValue();
		vi.mocked(marcarTokenComoUsado).mockResolvedValue(true);
		vi.mocked(invalidarTokensPendientes).mockResolvedValue();
	});

	it('consume el token, guarda la contraseña nueva e invalida el resto', async () => {
		const response = await POST(crearRequest({ token, contrasena: 'nueva-clave-segura', confirmacion: 'nueva-clave-segura' }));

		expect(response.status).toBe(200);
		expect(buscarTokenVigente).toHaveBeenCalledWith('hash-seguro');
		expect(marcarTokenComoUsado).toHaveBeenCalledWith('token-1');
		expect(actualizarContrasenaUsuario).toHaveBeenCalledWith('user-1', 'nueva-clave-segura');
		expect(invalidarTokensPendientes).toHaveBeenCalledWith('user-1');
	});

	it('no cambia la contraseña si otra solicitud ya consumió el enlace', async () => {
		vi.mocked(marcarTokenComoUsado).mockResolvedValue(false);

		const response = await POST(crearRequest({ token, contrasena: 'nueva-clave-segura', confirmacion: 'nueva-clave-segura' }));

		expect(response.status).toBe(400);
		expect(actualizarContrasenaUsuario).not.toHaveBeenCalled();
	});

	it('rechaza tokens vencidos, usados o inexistentes', async () => {
		vi.mocked(buscarTokenVigente).mockResolvedValue(null);

		const response = await POST(crearRequest({ token, contrasena: 'nueva-clave-segura', confirmacion: 'nueva-clave-segura' }));

		expect(response.status).toBe(400);
		expect((await response.json()).error).toBe('El enlace no es válido o ya venció.');
		expect(actualizarContrasenaUsuario).not.toHaveBeenCalled();
	});

	it('exige que token y contraseña tengan el formato correcto', async () => {
		const response = await POST(crearRequest({ token: 'corto', contrasena: 'clave-corta', confirmacion: 'otra-clave' }));

		expect(response.status).toBe(400);
		expect(buscarTokenVigente).not.toHaveBeenCalled();
	});
});