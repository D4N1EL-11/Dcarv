'use client';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { ESTADOS_EQUIPO } from '@/lib/config/soporte';
import { etiquetaEstadoEquipo } from '@/lib/formato';

type Props = {
  salas: { id: string; nombre: string }[];
  salaId?: string | undefined;
  estado?: string | undefined;
  busqueda?: string | undefined;
};

// Formulario GET: los filtros quedan en la URL y la página los lee en el servidor.
export function FiltrosEquipos({ salas, salaId = '', estado = '', busqueda = '' }: Props) {
  return (
    <form method="get" action="/soporte" className="grid items-end gap-3 sm:grid-cols-4">
      <Selector
        etiqueta="Sala"
        name="salaId"
        defaultValue={salaId}
        opciones={[
          { valor: '', texto: 'Todas' },
          ...salas.map((sala) => ({ valor: sala.id, texto: sala.nombre })),
        ]}
      />
      <Selector
        etiqueta="Estado"
        name="estado"
        defaultValue={estado}
        opciones={[
          { valor: '', texto: 'Todos' },
          ...ESTADOS_EQUIPO.map((valor) => ({ valor, texto: etiquetaEstadoEquipo(valor) })),
        ]}
      />
      <Campo etiqueta="Código" name="busqueda" defaultValue={busqueda} maxLength={40} />
      <Boton type="submit" variante="secundario">
        Filtrar
      </Boton>
    </form>
  );
}
