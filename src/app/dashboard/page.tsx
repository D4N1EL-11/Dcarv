'use client';

import { Container } from '@/components/ui/container';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { useCollection } from '@/hooks/use-collection';
import type { NoteRecord } from '@/modules/notes/types';

export default function DashboardPage() {
  const notes = useCollection<NoteRecord>('note');

  return (
    <Container className="py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold">Resumen operativo</h1>
        <p className="mt-2 text-[var(--text-secondary)]">Un centro de control ligero para tu información.</p>
      </div>
      <DashboardOverview noteCount={notes.data.length} />
    </Container>
  );
}
