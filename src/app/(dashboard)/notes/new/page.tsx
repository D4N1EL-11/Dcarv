'use client';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { NoteForm } from '@/components/notes/NoteForm';
import { useCollection } from '@/hooks/use-collection';
import type { NoteRecord } from '@/modules/notes/types';
export default function NewNotePage() { const router = useRouter(); const notes = useCollection<NoteRecord>('note'); return <Container className="py-10"><h1 className="mb-6 text-3xl font-bold">Nueva nota</h1><Card className="max-w-2xl"><NoteForm onSubmit={async (input) => { await notes.create(input); router.push('/dashboard/notes'); }} /></Card></Container>; }