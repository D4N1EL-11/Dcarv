'use client';
import { useCallback, useEffect, useState } from 'react';
import type { BaseRecord, CreateInput, UpdateInput } from '@/lib/types';
export function useCollection<T extends BaseRecord>(collectionName: string) {
  const [data, setData] = useState<T[]>([]); const [isLoading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => { setLoading(true); try { const response = await fetch(`/api/data/${collectionName}`); const body = await response.json() as { success: boolean; data: { data: T[] } | T[]; error?: string }; if (!body.success) throw new Error(body.error ?? 'Error de consulta'); setData(Array.isArray(body.data) ? body.data : body.data.data); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Error de consulta'); } finally { setLoading(false); } }, [collectionName]);
  useEffect(() => { void refetch(); }, [refetch]);
  async function request(method: 'POST' | 'PUT' | 'DELETE', body?: unknown, id?: string) { const response = await fetch(`/api/data/${collectionName}${id ? `?id=${id}` : ''}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const result = await response.json() as { success: boolean; data: T; error?: string }; if (!result.success) throw new Error(result.error ?? 'Error de operación'); await refetch(); return result.data; }
  return { data, isLoading, error, refetch, create: (input: CreateInput<T>) => request('POST', input), update: (id: string, input: UpdateInput<T>) => request('PUT', { id, ...input }), remove: async (id: string) => { await request('DELETE', undefined, id); return true; } };
}