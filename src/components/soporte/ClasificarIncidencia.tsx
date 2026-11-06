'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { CATEGORIAS_INCIDENCIA, PRIORIDADES_INCIDENCIA } from '@/lib/config/soporte';
import {
  AYUDA_PRIORIDAD,
  ETIQUETA_CATEGORIA,
  ETIQUETA_PRIORIDAD,
  type CategoriaIncidencia,
  type PrioridadIncidencia,
} from '@/lib/reglas/clasificacion';

type Props = { numeroCaso: string; categoria: CategoriaIncidencia; prioridad: PrioridadIncidencia };

// Soporte fija la prioridad y corrige la categoría. Se guarda con un botón explícito (no al
// cambiar el selector) para poder cambiar las dos cosas de una vez.
export function ClasificarIncidencia({ numeroCaso, categoria, prioridad }: Props) {
  const { mostrar } = useAvisos();
  const { refrescar, refrescando } = useRefrescar();
  const [nuevaCategoria, setNuevaCategoria] = useState(categoria);
  const [nuevaPrioridad, setNuevaPrioridad] = useState(prioridad);
  const [guardando, setGuardando] = useState(false);
  const cambio = nuevaCategoria !== categoria || nuevaPrioridad !== prioridad;

  async function guardar() {
    setGuardando(true);
    const respuesta = await llamarApi(`/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}`, 'PATCH', {
      ...(nuevaCategoria !== categoria ? { categoria: nuevaCategoria } : {}),
      ...(nuevaPrioridad !== prioridad ? { prioridad: nuevaPrioridad } : {}),
    });
    setGuardando(false);
    if (!respuesta.ok) {
      mostrar('error', respuesta.mensaje);
      return;
    }
    mostrar('exito', `${numeroCaso} actualizada.`);
    refrescar();
  }

  return (
    <div className="grid gap-3">
      <Selector
        etiqueta="Prioridad"
        value={nuevaPrioridad}
        disabled={guardando || refrescando}
        onChange={(evento) => setNuevaPrioridad(evento.target.value as PrioridadIncidencia)}
        opciones={PRIORIDADES_INCIDENCIA.map((p) => ({ valor: p, texto: ETIQUETA_PRIORIDAD[p] }))}
      />
      <p className="-mt-2 text-xs text-texto-suave">{AYUDA_PRIORIDAD[nuevaPrioridad]}</p>
      <Selector
        etiqueta="Categoría"
        value={nuevaCategoria}
        disabled={guardando || refrescando}
        onChange={(evento) => setNuevaCategoria(evento.target.value as CategoriaIncidencia)}
        opciones={CATEGORIAS_INCIDENCIA.map((c) => ({ valor: c, texto: ETIQUETA_CATEGORIA[c] }))}
      />
      {cambio ? (
        <div className="flex gap-2">
          <Boton onClick={guardar} cargando={guardando || refrescando}>
            Guardar
          </Boton>
          <Boton
            variante="secundario"
            disabled={guardando}
            onClick={() => {
              setNuevaCategoria(categoria);
              setNuevaPrioridad(prioridad);
            }}
          >
            Descartar
          </Boton>
        </div>
      ) : null}
    </div>
  );
}
