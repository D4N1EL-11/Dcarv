import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

// Pruebas de extremo a extremo (e2e/) que no necesitan base de datos: pantallas de acceso y la
// barrera de permisos del middleware. En GitHub Actions corren sobre el build de producción.
// En este equipo usan Edge y reutilizan el servidor de desarrollo si ya está encendido.
const enCi = Boolean(process.env.CI);

// Las pruebas firman sesiones con el mismo JWT_SECRET que el servidor: en local sale de
// .env.local (como en next dev); en CI, de la variable del flujo de trabajo.
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: enCi ? 1 : 0,
  reporter: enCi ? 'github' : 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'navegador', use: { ...devices['Desktop Chrome'], ...(enCi ? {} : { channel: 'msedge' }) } }],
  webServer: {
    command: enCi ? 'npx next start -p 3000' : 'npx next dev -p 3000',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !enCi,
    timeout: 180_000,
  },
});
