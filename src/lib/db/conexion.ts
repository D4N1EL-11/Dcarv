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

// Tareas que deben esperar a que la transacción se confirme (p. ej. enviar una notificación
// push): si la transacción se revierte, no se ejecutan.
const pendientesAlConfirmar = new WeakMap<PoolClient, (() => void)[]>();

export function despuesDeConfirmar(tx: PoolClient, tarea: () => void): void {
  const lista = pendientesAlConfirmar.get(tx) ?? [];
  lista.push(tarea);
  pendientesAlConfirmar.set(tx, lista);
}

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  const tx = await obtenerPool().connect();
  try {
    await tx.query('BEGIN');
    const resultado = await trabajo(tx);
    await tx.query('COMMIT');
    // Ya confirmada: una tarea que falla no puede deshacer el cambio ni volverlo un error.
    for (const tarea of pendientesAlConfirmar.get(tx) ?? []) {
      try {
        tarea();
      } catch (error) {
        console.error(error);
      }
    }
    return resultado;
  } catch (error) {
    await tx.query('ROLLBACK');
    throw traducirErrorPostgres(error) ?? error;
  } finally {
    pendientesAlConfirmar.delete(tx);
    tx.release();
  }
}

// Arma la lista de valores de una consulta: p(valor) agrega el valor y devuelve su marcador ($n).
// Así ningún dato se concatena en el SQL (sección 15 del plan).
export function crearParametros() {
  const valores: unknown[] = [];
  return {
    valores,
    p(valor: unknown): string {
      valores.push(valor);
      return `$${valores.length}`;
    },
  };
}

export async function cerrarConexion(): Promise<void> {
  await globalParaPool.poolSoporte?.end();
  delete globalParaPool.poolSoporte;
}
