import { promises as fs } from 'node:fs';
import path from 'node:path';
import { kv } from '@vercel/kv';

export interface StorageAdapter { read(collection: string): Promise<string | null>; write(collection: string, content: string): Promise<void>; }
const localDirectory = () => path.resolve(process.env.DATA_DIR ?? './data');

export class FileAdapter implements StorageAdapter {
  async read(collection: string) { try { return await fs.readFile(path.join(localDirectory(), `${collection}.json`), 'utf8'); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; } }
  async write(collection: string, content: string) { await fs.mkdir(localDirectory(), { recursive: true }); await fs.writeFile(path.join(localDirectory(), `${collection}.json`), content, 'utf8'); }
}

export class VercelKVAdapter implements StorageAdapter {
  async read(collection: string) { return await kv.get<string>(`dcarv:collection:${collection}`); }
  async write(collection: string, content: string) { await kv.set(`dcarv:collection:${collection}`, content); }
}

export const storageAdapter: StorageAdapter = process.env.VERCEL === '1' ? new VercelKVAdapter() : new FileAdapter();