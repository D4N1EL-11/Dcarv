'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { ESTADOS_EQUIPO } from '@/lib/config/soporte';
import { etiquetaEstadoEquipo, plural } from '@/lib/formato';

type Props = {
  salas: { id: string; nombre: string }[];
  salaId?: string | undefined;
  estado?: string | undefined;
  busqueda?: string | undefined;
  total: number;
};

// Los filtros viven en la URL (se pueden compartir o guardar); la página los lee en el servidor.
// Sala y estado se aplican al cambiar; la búsqueda, al pulsar Buscar o Enter.
export function FiltrosEquipos({ salas, salaId = '', estado = '', busqueda = '', total }: Props) {
  const router = useRouter();
  const [actualizando, iniciar] = useTransition();
  const [valores, setValores] = useState({ salaId, estado, busqueda });

  function aplicar(cambios: Partial<typeof valores>) {
    const siguientes = { ...valores, ...cambios };
    setValores(siguientes);
    const consulta = new URLSearchParams();
    for (const [nombre, valor] of Object.entries(siguientes)) {
      if (valor.trim()) consulta.set(nombre, valor.trim());
    }
    const texto = consulta.toString();
    iniciar(() => router.push(texto ? `/soporte?${texto}` : '/soporte', { scroll: false }));
  }

  function buscar(evento: FormEvent) {
    evento.preventDefault();
    aplicar({});
  }

  const hayFiltros = Boolean(salaId || estado || busqueda);

  return (
    <section aria-label="Filtros de equipos" className="grid gap-2">
      <form
        onSubmit={buscar}
        className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <Selector
          etiqueta="Sala"
          value={valores.salaId}
          onChange={(evento) => aplicar({ salaId: evento.target.value })}
          opciones={[
            { valor: '', texto: 'Todas las salas' },
            ...salas.map((sala) => ({ valor: sala.id, texto: sala.nombre })),
          ]}
        />
        <Selector
          etiqueta="Estado"
          value={valores.estado}
          onChange={(evento) => aplicar({ estado: evento.target.value })}
          opciones={[
            { valor: '', texto: 'Todos los estados' },
            ...ESTADOS_EQUIPO.map((valor) => ({ valor, texto: etiquetaEstadoEquipo(valor) })),
          ]}
        />
        <Campo
          etiqueta="Buscar por código"
          type="search"
          placeholder="Ej.: PC-SALA1"
          maxLength={40}
          value={valores.busqueda}
          onChange={(evento) => setValores({ ...valores, busqueda: evento.target.value })}
        />
        <Boton type="submit" variante="secundario">
          Buscar
        </Boton>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-texto-suave">
        <p role="status" aria-live="polite">
          {actualizando
            ? 'Actualizando la lista...'
            : `${plural(total, 'equipo', 'equipos')}${hayFiltros ? ' con los filtros actuales' : ' en total'}`}
        </p>
        {hayFiltros ? (
          <Link href="/soporte" className="font-semibold text-primario underline">
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </section>
  );
}
