import { expect, test } from '@playwright/test';

// Pantallas de acceso: todo lo que se comprueba aquí ocurre en el navegador, sin base de datos.

test('el login muestra y oculta la contraseña', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
  const clave = page.locator('#password');
  await clave.fill('Secreta123');
  await expect(clave).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(clave).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
  await expect(clave).toHaveAttribute('type', 'password');
});

test('el login valida los campos antes de enviar', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Ingresa tu correo electrónico.')).toBeVisible();
  await expect(page.getByText('Ingresa tu contraseña.')).toBeVisible();
});

test('al crear cuenta se avisa qué tipo de cuenta será según el correo', async ({ page }) => {
  await page.goto('/register');
  const correo = page.locator('#email');
  await correo.fill('ana@gmail.com');
  await expect(page.getByText(/Cuenta de reporte: podrás reportar fallas/)).toBeVisible();
  await correo.fill('ana@usa.edu.co');
  await expect(page.getByText(/Cuenta de soporte: gestionarás/)).toBeVisible();
});

test('el registro mide la contraseña y confirma que coinciden', async ({ page }) => {
  await page.goto('/register');
  await page.locator('#password').fill('12345678');
  await expect(page.getByText('Es una contraseña muy común: cualquiera la adivina.')).toBeVisible();
  await page.locator('#password').fill('Salas.2026x');
  // El nivel lleva un prefijo para lectores de pantalla ("Seguridad de la contraseña: …").
  await expect(page.getByText('Seguridad de la contraseña: Fuerte')).toBeVisible();
  await page.locator('#confirmacion').fill('Salas.2026x');
  await expect(page.getByText('Las contraseñas coinciden.')).toBeVisible();
});

test('sin sesión, una página del módulo lleva al login y recuerda a dónde iba', async ({ page }) => {
  await page.goto('/soporte/incidencias');
  await expect(page).toHaveURL(/\/login\?siguiente=%2Fsoporte%2Fincidencias/);
  // "Crear cuenta" conserva el destino (por ejemplo, el reporte de un equipo abierto desde su QR).
  await expect(page.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', /siguiente=%2Fsoporte%2Fincidencias/);
});
