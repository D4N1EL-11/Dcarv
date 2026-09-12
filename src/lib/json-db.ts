import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CollectionFile, CreateInput, QueryOptions, QueryResult, BaseRecord, UpdateInput } from './types';
import { generateId, now } from './utils';
import { storageAdapter } from './storage';

const locks = new Map<string, Promise<void>>();

export class JsonDBError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'DUPLICATE_ID' | 'VALIDATION_ERROR' | 'IO_ERROR' | 'READ_ONLY',
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = 'JsonDBError';
  }
}

export class ReadOnlyError extends JsonDBError {
  constructor() {
    super('La persistencia de archivos está en modo de solo lectura.', 'READ_ONLY', 503);
  }
}

function dataDirectory(): string {
  return path.resolve(process.env.DATA_DIR ?? './data');
}

export function resolveCollectionPath(name: string): string {
  if (!/^[a-z0-9-]+$/.test(name)) throw new JsonDBError('Nombre de colección inválido.', 'VALIDATION_ERROR', 400);
  return path.join(dataDirectory(), `${name}.json`);
}

async function readCollection<T extends BaseRecord>(name: string): Promise<CollectionFile<T>> {
  try {
    const content = await storageAdapter.read(name);
    if (content === null) throw new JsonDBError(`Colección no encontrada: ${name}`, 'NOT_FOUND', 404);
    return JSON.parse(content) as CollectionFile<T>;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') throw new JsonDBError(`Colección no encontrada: ${name}`, 'NOT_FOUND', 404);
    throw new JsonDBError(`No se pudo leer la colección ${name}.`, 'IO_ERROR', 500);
  }
}

async function withWriteLock<T>(collection: string, action: () => Promise<T>): Promise<T> {
  const previous = locks.get(collection) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  locks.set(collection, current);
  await previous;
  try {
    return await action();
  } finally {
    release();
    if (locks.get(collection) === current) locks.delete(collection);
  }
}

async function writeCollection<T extends BaseRecord>(name: string, data: CollectionFile<T>): Promise<void> {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_KV_REST_API_URL) throw new ReadOnlyError();
  const filePath = resolveCollectionPath(name);
  try {
    if (process.env.VERCEL === '1') {
      await storageAdapter.write(name, JSON.stringify(data, null, 2));
      return;
    }
    await fs.mkdir(dataDirectory(), { recursive: true });
    const backupDirectory = path.join(dataDirectory(), '_backups');
    await fs.mkdir(backupDirectory, { recursive: true });
    try {
      const previous = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(path.join(backupDirectory, `${name}_${Date.now()}.json`), previous, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(temporaryPath, filePath);
  } catch {
    throw new JsonDBError(`No se pudo escribir la colección ${name}.`, 'IO_ERROR', 500);
  }
}

export async function getAll<T extends BaseRecord>(name: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
  const collection = await readCollection<T>(name);
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? 50);
  const records = [...collection.records];
  if (options.sortBy) {
    const sortBy = options.sortBy;
    records.sort((left, right) => {
      const a = String((left as unknown as Record<string, unknown>)[sortBy] ?? '');
      const b = String((right as unknown as Record<string, unknown>)[sortBy] ?? '');
      return (a.localeCompare(b) || 0) * (options.sortOrder === 'desc' ? -1 : 1);
    });
  }
  return { data: records.slice(offset, offset + limit), total: records.length, limit, offset };
}

export async function getById<T extends BaseRecord>(name: string, id: string): Promise<T | null> {
  const collection = await readCollection<T>(name);
  return collection.records.find((record) => record.id === id) ?? null;
}

export async function create<T extends BaseRecord>(name: string, input: CreateInput<T>, prefix = name.slice(0, 3)): Promise<T> {
  return withWriteLock(name, async () => {
    const collection = await readCollection<T>(name);
    const timestamp = now();
    const record = { ...input, id: generateId(prefix), createdAt: timestamp, updatedAt: timestamp } as T;
    collection.records.push(record);
    collection._meta.lastModified = timestamp;
    await writeCollection(name, collection);
    return record;
  });
}

export async function update<T extends BaseRecord>(name: string, id: string, partial: UpdateInput<T>): Promise<T> {
  return withWriteLock(name, async () => {
    const collection = await readCollection<T>(name);
    const index = collection.records.findIndex((record) => record.id === id);
    if (index < 0) throw new JsonDBError(`Registro no encontrado: ${id}`, 'NOT_FOUND', 404);
    const current = collection.records[index];
    if (!current) throw new JsonDBError(`Registro no encontrado: ${id}`, 'NOT_FOUND', 404);
    const updated = { ...current, ...partial, id, updatedAt: now() } as T;
    collection.records[index] = updated;
    collection._meta.lastModified = updated.updatedAt;
    await writeCollection(name, collection);
    return updated;
  });
}

export async function remove(name: string, id: string): Promise<boolean> {
  return withWriteLock(name, async () => {
    const collection = await readCollection(name);
    const remaining = collection.records.filter((record) => record.id !== id);
    if (remaining.length === collection.records.length) throw new JsonDBError(`Registro no encontrado: ${id}`, 'NOT_FOUND', 404);
    collection.records = remaining;
    collection._meta.lastModified = now();
    await writeCollection(name, collection);
    return true;
  });
}

export async function query<T extends BaseRecord>(name: string, filter: (record: T) => boolean): Promise<T[]> {
  const collection = await readCollection<T>(name);
  return collection.records.filter(filter);
}

export async function count(name: string): Promise<number> {
  const collection = await readCollection(name);
  return collection.records.length;
}