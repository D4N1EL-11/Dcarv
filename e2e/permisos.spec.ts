import { expect, test, type APIRequestContext } from '@playwright/test';
import { SignJWT } from 'jose';

// Barrera de permisos del middleware con sesiones firmadas en la prueba (el mismo secreto que
// usa el servidor). Las respuestas llegan antes de tocar la base de datos.
const secreto = new TextEncoder().encode(process.env.JWT_SECRET ?? 'development-only-secret-change-me');

async function cookieDe(rol: 'viewer' | 'editor'): Promise<string> {
  const token = await new SignJWT({ userId: '00000000-0000-4000-8000-000000000000', email: `e2e-${rol}@example.com`, role: rol })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secreto);
  return `dcarv_session=${token}`;
}

async function pedir(request: APIRequestContext, metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE', ruta: string, cookie?: string) {
  return request.fetch(ruta, {
    method: metodo,
    headers: cookie ? { cookie } : {},
    maxRedirects: 0,
    ...(metodo === 'GET' ? {} : { data: {} }),
  });
}

test('sin sesión, la API responde 401', async ({ request }) => {
  const respuesta = await pedir(request, 'GET', '/api/soporte/sesion');
  expect(respuesta.status()).toBe(401);
  expect((await respuesta.json()).error.codigo).toBe('NO_AUTORIZADO');
});

test('una cuenta de reporte que abre páginas de soporte va a "Reportar una falla"', async ({ request }) => {
  const cookie = await cookieDe('viewer');
  for (const ruta of ['/soporte', '/soporte/salas', '/soporte/tecnicos', '/soporte/alertas', '/soporte/incidencias', '/soporte/usuarios']) {
    const respuesta = await pedir(request, 'GET', ruta, cookie);
    expect(respuesta.status(), ruta).toBe(307);
    expect(respuesta.headers().location, ruta).toMatch(/\/soporte\/reportar$/);
  }
  const ficha = await pedir(request, 'GET', '/soporte/equipos/PC-01', cookie);
  expect(ficha.headers().location).toMatch(/\/soporte\/reportar\?equipo=PC-01$/);
});

test('una cuenta de reporte no puede cambiar estados ni administrar', async ({ request }) => {
  const cookie = await cookieDe('viewer');
  const prohibidas: ['POST' | 'PATCH' | 'DELETE' | 'GET', string][] = [
    ['PATCH', '/api/soporte/equipos/PC-01/estado'],
    ['POST', '/api/soporte/salas'],
    ['DELETE', '/api/soporte/salas/00000000-0000-4000-8000-000000000000'],
    ['POST', '/api/soporte/equipos'],
    ['POST', '/api/soporte/tecnicos'],
    ['POST', '/api/soporte/incidencias/INC-0001/cerrar'],
    ['POST', '/api/soporte/incidencias/INC-0001/asignar'],
    ['GET', '/api/soporte/exportar/equipos'],
    ['PATCH', '/api/soporte/usuarios/00000000-0000-4000-8000-000000000000'],
  ];
  for (const [metodo, ruta] of prohibidas) {
    const respuesta = await pedir(request, metodo, ruta, cookie);
    expect(respuesta.status(), `${metodo} ${ruta}`).toBe(403);
    expect((await respuesta.json()).error.codigo).toBe('SIN_PERMISO');
  }
});

test('las páginas de una cuenta de reporte no se le bloquean', async ({ request }) => {
  const cookie = await cookieDe('viewer');
  for (const ruta of ['/soporte/reportar', '/soporte/mis-reportes', '/soporte/ayuda', '/soporte/cuenta']) {
    const respuesta = await pedir(request, 'GET', ruta, cookie);
    // El middleware la deja pasar (no redirige); el contenido depende de la base y no se evalúa aquí.
    expect(respuesta.status(), ruta).not.toBe(307);
  }
});

test('una cuenta de soporte pasa la barrera del middleware', async ({ request }) => {
  const cookie = await cookieDe('editor');
  const respuesta = await pedir(request, 'GET', '/soporte/salas', cookie);
  expect(respuesta.status()).not.toBe(307);
  // "Cuentas y roles" es solo de administradores: soporte vuelve al panel.
  const usuarios = await pedir(request, 'GET', '/soporte/usuarios', cookie);
  expect(usuarios.status()).toBe(307);
  expect(usuarios.headers().location).toMatch(/\/soporte$/);
});
