import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
import pg from 'pg';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const nombreConexion = 'Dcarv_POSTGRES_URL_NON_POOLING';
const valorConexion = process.env[nombreConexion];

if (!valorConexion) {
	console.error(`Falta configurar ${nombreConexion}.`);
	process.exit(1);
}

const urlConexion = new URL(valorConexion);
urlConexion.searchParams.delete('sslmode');

const pool = new pg.Pool({
	connectionString: urlConexion.toString(),
	ssl: { rejectUnauthorized: false },
	max: 1,
	connectionTimeoutMillis: 15_000,
});

async function registrarMigracionAnterior(client, archivo) {
	if (archivo !== '20261003000000_create_users_table.sql') return false;

	const tabla = await client.query(`
		SELECT to_regclass('public.users') IS NOT NULL AS existe
	`);
	if (!tabla.rows[0].existe) return false;

	const columnas = await client.query(`
		SELECT column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'users'
	`);
	const esperadas = ['id', 'email', 'role', 'created_at', 'updated_at'];
	const encontradas = new Set(columnas.rows.map((fila) => fila.column_name));
	if (!esperadas.every((columna) => encontradas.has(columna))) return false;

	const funcion = await client.query(`
		SELECT to_regprocedure('public.sync_auth_user()') IS NOT NULL AS existe
	`);
	if (!funcion.rows[0].existe) return false;

	await client.query('BEGIN');
	try {
		await client.query(
			'INSERT INTO public._migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
			[archivo],
		);
		await client.query('COMMIT');
		console.log(`omitida ${archivo}: migración previa ya aplicada; registrada en _migrations`);
		return true;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	}
}

async function main() {
	let client;
	try {
		client = await pool.connect();
		await client.query(`
			CREATE TABLE IF NOT EXISTS public._migrations (
				name TEXT PRIMARY KEY,
				applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`);

		const carpetaMigraciones = path.join(process.cwd(), 'supabase', 'migrations');
		const archivos = (await readdir(carpetaMigraciones))
			.filter((archivo) => /^\d+_.+\.sql$/i.test(archivo))
			.sort((a, b) => a.localeCompare(b));

		for (const archivo of archivos) {
			const aplicada = await client.query(
				'SELECT 1 FROM public._migrations WHERE name = $1',
				[archivo],
			);
			if (aplicada.rowCount) {
				console.log(`omitida ${archivo}`);
				continue;
			}

			if (await registrarMigracionAnterior(client, archivo)) continue;

			const sql = await readFile(path.join(carpetaMigraciones, archivo), 'utf8');
			await client.query('BEGIN');
			try {
				await client.query(sql);
				await client.query(
					'INSERT INTO public._migrations (name) VALUES ($1)',
					[archivo],
				);
				await client.query('COMMIT');
				console.log(`aplicada ${archivo}`);
			} catch (error) {
				await client.query('ROLLBACK');
				throw new Error(`Falló ${archivo}: ${error.message}`, { cause: error });
			}
		}
	} finally {
		client?.release();
		await pool.end();
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
