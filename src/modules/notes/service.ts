import { create, getAll, getById, remove, update } from '@/lib/json-db';
import type { CreateInput, UpdateInput } from '@/lib/types';
import type { NoteRecord } from './types';
export const listNotes = () => getAll<NoteRecord>('note', { limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' });
export const getNote = (id: string) => getById<NoteRecord>('note', id);
export const createNote = (input: CreateInput<NoteRecord>) => create<NoteRecord>('note', input, 'not');
export const updateNote = (id: string, input: UpdateInput<NoteRecord>) => update<NoteRecord>('note', id, input);
export const deleteNote = (id: string) => remove('note', id);