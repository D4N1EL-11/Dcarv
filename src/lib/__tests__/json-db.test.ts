import { describe, expect, it } from 'vitest';
import { count, getAll, getById, query } from '../json-db';
import type { BaseRecord } from '../types';

describe('json-db', () => {
  it('lee una colección y pagina sus registros', async () => {
    const result = await getAll<BaseRecord>('example', { limit: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBeGreaterThan(0);
  });
  it('busca por id y permite filtrar', async () => {
    const record = await getById<BaseRecord>('example', 'ex_001');
    expect(record?.id).toBe('ex_001');
    expect((await query<BaseRecord>('example', (item) => item.id === 'ex_001'))).toHaveLength(1);
  });
  it('cuenta registros', async () => { expect(await count('example')).toBe(1); });
});