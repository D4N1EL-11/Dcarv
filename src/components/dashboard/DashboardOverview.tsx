'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function DashboardOverview({ noteCount }: { noteCount: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">Notas almacenadas</p>
        <p className="mt-3 text-4xl font-bold">{noteCount}</p>
        <Badge variant="success">JSON-DB local</Badge>
      </Card>
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">Sistema</p>
        <p className="mt-3 text-2xl font-bold">Operativo</p>
        <Link className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]" href="/status">
          Ver estado
        </Link>
      </Card>
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">Acción rápida</p>
        <Link className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white" href="/notes/new">
          Crear nota
        </Link>
      </Card>
    </div>
  );
}
