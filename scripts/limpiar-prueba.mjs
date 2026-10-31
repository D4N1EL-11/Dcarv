import nextEnv from '@next/env';
import pg from 'pg';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const nombreConexion = 'Dcarv_POSTGRES_URL_NON_POOLING';
if (!process.env[nombreConexion]) {
  console.error(`Falta configurar ${nombreConexion}.`);
  process.exit(1);
}

const argumentos = process.argv.slice(2);
const soloUno = argumentos.includes('--prueba') !== argumentos.includes('--demo');
const prefijos = soloUno
  ? [argumentos.includes('--prueba') ? 'Prueba %' : 'Demo %']
  : ['Prueba %', 'Demo %'];

const url = new URL(process.env[nombreConexion]);
url.searchParams.delete('sslmode');
const cliente = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });

const SALAS = `SELECT id FROM salas WHERE nombre ILIKE ANY($1)`;
const EQUIPOS = `SELECT id FROM equipos WHERE sala_id IN (${SALAS})`;

async function main() {
  await cliente.connect();
  try {
    await cliente.query('BEGIN');
    const incidencias = await cliente.query(
      `DELETE FROM incidencias WHERE equipo_id IN (${EQUIPOS})`,
      [prefijos],
    );
    const equipos = await cliente.query(`DELETE FROM equipos WHERE sala_id IN (${SALAS})`, [prefijos]);
    const salas = await cliente.query(`DELETE FROM salas WHERE nombre ILIKE ANY($1)`, [prefijos]);
    const tecnicos = await cliente.query(`DELETE FROM tecnicos WHERE nombre ILIKE ANY($1)`, [prefijos]);
    await cliente.query('COMMIT');
    console.log(
      `Borrados (${prefijos.join(', ')}): ${incidencias.rowCount} incidencias, ${equipos.rowCount} equipos, ${salas.rowCount} salas, ${tecnicos.rowCount} técnicos.`,
    );
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    await cliente.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
