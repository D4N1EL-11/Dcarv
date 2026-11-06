import { expect, test } from '@playwright/test';

// App instalable (PWA) y renovación de la sesión: nada de esto necesita base de datos.

test('el manifiesto describe la app instalable', async ({ request }) => {
  const respuesta = await request.get('/manifest.webmanifest');
  expect(respuesta.status()).toBe(200);
  const manifiesto = await respuesta.json();
  expect(manifiesto.name).toBe('Soporte de Salas');
  expect(manifiesto.start_url).toBe('/soporte');
  expect(manifiesto.display).toBe('standalone');
  const tamanos = manifiesto.icons.map((i: { sizes: string }) => i.sizes);
  expect(tamanos).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifiesto.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icono of manifiesto.icons as { src: string }[]) {
    const imagen = await request.get(icono.src);
    expect(imagen.status(), icono.src).toBe(200);
    expect(imagen.headers()['content-type']).toContain('image/png');
  }
});

test('el service worker se sirve sin caché y no guarda la API', async ({ request }) => {
  const respuesta = await request.get('/sw.js');
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['cache-control']).toContain('no-cache');
  const codigo = await respuesta.text();
  expect(codigo).toContain("const PAGINA_SIN_CONEXION = '/offline'");
  // Solo navegación, íconos y estáticos con huella: nunca /api/ ni páginas con datos.
  expect(codigo).not.toMatch(/cache\.put\(/);
});

test('la página "Sin conexión" es pública y funciona sin JavaScript', async ({ page }) => {
  await page.route('**/*.js', (ruta) => ruta.abort()); // como sin red: los scripts no cargan
  const respuesta = await page.goto('/offline');
  expect(respuesta?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Sin conexión' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
});

test('la página de inicio de sesión enlaza el manifiesto y el ícono para iPhone', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test('renovar la sesión sin haber iniciado sesión responde 401', async ({ request }) => {
  const respuesta = await request.post('/api/auth/sesion');
  expect(respuesta.status()).toBe(401);
});
