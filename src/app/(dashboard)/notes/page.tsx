'use client';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { NoteList } from '@/components/notes/NoteList';
import { useCollection } from '@/hooks/use-collection';
import type { NoteRecord } from '@/modules/notes/types';
export default function NotesPage() { const notes = useCollection<NoteRecord>('note'); return <Container className="py-10"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Módulo</p><h1 className="mt-2 text-3xl font-bold">Notas</h1></div><Link className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white" href="/dashboard/notes/new">Nueva nota</Link></div>{notes.error ? <p className="text-red-600">{notes.error}</p> : notes.isLoading ? <p className="text-[var(--text-secondary)]">Cargando notas...</p> : <NoteList notes={notes.data} onDelete={(id) => { void notes.remove(id); }} />}</Container>; }