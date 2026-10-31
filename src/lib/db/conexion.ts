import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';
import { traducirErrorPostgres } from '@/lib/reglas/errores';

types.setTypeParser(1082, (v) => v); // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v); // TIMESTAMP → texto
types.setTypeParser(1184, (v) => v); // TIMESTAMPTZ → texto
types.setTypeParser(20, (v) => parseInt(v, 10)); // BIGINT (COUNT) → number

// En Vercel, transaction pooler (6543), apropiado para funciones serverless. En local, 5432:
// la red de la universidad no deja salir por 6543.
function urlConexion(): string {
  const nombre = process.env.VERCEL ? 'Dcarv_POSTGRES_URL' : 'Dcarv_POSTGRES_URL_NON_POOLING';
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta configurar ${nombre}.`);
  const url = new URL(valor);
  // pg interpreta sslmode=require como verify-full e ignoraría la opción ssl de abajo.
  url.searchParams.delete('sslmode');
  return url.toString();
}

const globalParaPool = globalThis as unknown as { poolSoporte?: Pool };

function obtenerPool(): Pool {
  globalParaPool.poolSoporte ??= new Pool({
    connectionString: urlConexion(),
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return globalParaPool.poolSoporte;
}

export async function consultar<T extends QueryResultRow>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  try {
    const resultado = await obtenerPool().query<T>(sql, valores);
    return resultado.rows;
  } catch (error) {
    throw traducirErrorPostgres(error) ?? error;
  }
}

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  const tx = await obtenerPool().connect();
  try {
    await tx.query('BEGIN');
    const resultado = await trabajo(tx);
    await tx.query('COMMIT');
    return resultado;
  } catch (error) {
    await tx.query('ROLLBACK');
    throw traducirErrorPostgres(error) ?? error;
  } finally {
    tx.release();
  }
}

export async function cerrarConexion(): Promise<void> {
  await globalParaPool.poolSoporte?.end();
  delete globalParaPool.poolSoporte;
}
