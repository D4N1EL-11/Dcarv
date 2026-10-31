'use client';

import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { puedeAsignarse, type EstadoIncidencia } from '@/lib/reglas/incidencia';

type Props = {
  numeroCaso: string;
  estado: EstadoIncidencia;
  tecnicos: { id: string; nombre: string }[];
};

export function AccionesIncidencia({ numeroCaso, estado, tecnicos }: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function ejecutar(accion: 'cerrar' | 'asignar', cuerpo?: unknown) {
    setCargando(true);
    setError('');
    const respuesta = await llamarApi(
      `/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/${accion}`,
      'POST',
      cuerpo,
    );
    setCargando(false);
    if (respuesta.ok) refrescar();
    else setError(respuesta.mensaje);
  }

  if (estado === 'cerrada') return null;

  return (
    <div className="grid gap-2">
      {puedeAsignarse(estado) && tecnicos.length ? (
        <Selector
          etiqueta={`Asignar técnico a ${numeroCaso}`}
          ocultarEtiqueta
          value=""
          disabled={cargando || refrescando}
          opciones={[
            { valor: '', texto: 'Asignar técnico' },
            ...tecnicos.map((t) => ({ valor: t.id, texto: t.nombre })),
          ]}
          onChange={(evento) => {
            if (evento.target.value) void ejecutar('asignar', { tecnicoId: evento.target.value });
          }}
        />
      ) : null}
      <Boton variante="secundario" cargando={cargando || refrescando} onClick={() => ejecutar('cerrar')}>
        Cerrar
      </Boton>
      {error ? (
        <p role="alert" className="text-sm text-baja">
          {error}
        </p>
      ) : null}
    </div>
  );
}
