import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const aviso = 'Aviso: no se pudo renovar la conexión con Vercel. El envío de correos no funcionará en local.';
const temporal = join(process.cwd(), '.env.vercel.local');
const entornoLocal = join(process.cwd(), '.env.local');

try {
	if (process.platform === 'win32') {
		execFileSync('cmd.exe', ['/d', '/s', '/c', 'npx vercel env pull .env.vercel.local --yes'], { stdio: 'ignore' });
	} else {
		execFileSync('npx', ['vercel', 'env', 'pull', '.env.vercel.local', '--yes'], { stdio: 'ignore' });
	}

	const contenidoTemporal = readFileSync(temporal, 'utf8');
	const lineaToken = contenidoTemporal.split(/\r?\n/).find((linea) => /^\s*VERCEL_OIDC_TOKEN\s*=/.test(linea));
	if (!lineaToken || !lineaToken.slice(lineaToken.indexOf('=') + 1).trim()) throw new Error('Token no encontrado.');

	const contenidoLocal = readFileSync(entornoLocal, 'utf8');
	const lineas = contenidoLocal.split(/\r?\n/);
	const indiceToken = lineas.findIndex((linea) => /^\s*VERCEL_OIDC_TOKEN\s*=/.test(linea));
	if (indiceToken >= 0) lineas[indiceToken] = lineaToken;
	else lineas.push(lineaToken);

	const salto = contenidoLocal.includes('\r\n') ? '\r\n' : '\n';
	let nuevoContenido = lineas.join(salto);
	if (!nuevoContenido.endsWith(salto)) nuevoContenido += salto;
	writeFileSync(entornoLocal, nuevoContenido, 'utf8');
} catch {
	console.log(aviso);
} finally {
	try {
		unlinkSync(temporal);
	} catch {
		// El archivo puede no existir si env pull falló.
	}
}