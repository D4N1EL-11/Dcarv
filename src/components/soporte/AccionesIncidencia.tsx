'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import {
  puedeAsignarse,
  puedeReactivarseAlCerrar,
  type EstadoIncidencia,
} from '@/lib/reglas/incidencia';

type Props = {
  numeroCaso: string;
  estado: EstadoIncidencia;
  equipoCodigo: string;
  estadoEquipo: EstadoEquipo;
  otrasPendientes: number;
  tecnicos: { id: string; nombre: string }[];
};

// Asignar y cerrar no tienen vuelta atrás desde la interfaz (no hay "reabrir" ni "desasignar"),
// por eso ninguna de las dos se ejecuta con un solo cambio del selector o un solo clic.
export function AccionesIncidencia({
  numeroCaso,
  estado,
  equipoCodigo,
  estadoEquipo,
  otrasPendientes,
  tecnicos,
}: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const ofrecerReactivar = puedeReactivarseAlCerrar(estadoEquipo, otrasPendientes);
  const [reactivar, setReactivar] = useState(ofrecerReactivar);
  const ocupado = cargando || refrescando;

  async function ejecutar(accion: 'cerrar' | 'asignar', cuerpo?: unknown) {
    setCargando(true);
    setError('');
    const respuesta = await llamarApi<{ equipoReactivado?: boolean }>(
      `/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/${accion}`,
      'POST',
      cuerpo,
    );
    setCargando(false);
    setConfirmandoCierre(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    if (accion === 'asignar') {
      const nombre = tecnicos.find((t) => t.id === tecnicoId)?.nombre ?? 'el técnico';
      mostrar('exito', `${numeroCaso} asignada a ${nombre}.`);
    } else {
      mostrar(
        'exito',
        respuesta.datos.equipoReactivado
          ? `${numeroCaso} cerrada. ${equipoCodigo} vuelve a estar funcional.`
          : `${numeroCaso} cerrada.`,
      );
    }
    refrescar();
  }

  if (estado === 'cerrada') return null;

  return (
    <div className="grid gap-2">
      {puedeAsignarse(estado) && tecnicos.length ? (
        <form
          className="grid gap-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (tecnicoId) void ejecutar('asignar', { tecnicoId });
          }}
        >
          <Selector
            etiqueta={`Técnico para ${numeroCaso}`}
            ocultarEtiqueta
            value={tecnicoId}
            disabled={ocupado}
            opciones={[
              { valor: '', texto: 'Elegir técnico' },
              ...tecnicos.map((t) => ({ valor: t.id, texto: t.nombre })),
            ]}
            onChange={(evento) => setTecnicoId(evento.target.value)}
          />
          {tecnicoId ? (
            <Boton type="submit" cargando={ocupado}>
              Asignar
            </Boton>
          ) : null}
        </form>
      ) : null}
      <Boton
        variante="secundario"
        disabled={ocupado}
        onClick={() => {
          setReactivar(ofrecerReactivar); // Los datos pudieron cambiar desde el último refresco.
          setConfirmandoCierre(true);
        }}
      >
        Cerrar
      </Boton>
      {error ? (
        <p role="alert" className="text-sm text-baja">
          {error}
        </p>
      ) : null}
      {confirmandoCierre ? (
        <Modal titulo={`Cerrar ${numeroCaso}`} alCerrar={() => setConfirmandoCierre(false)}>
          <p className="text-sm">
            La incidencia quedará cerrada y no se podrá reabrir. Si la falla vuelve, reporte una
            nueva incidencia.
          </p>
          {ofrecerReactivar ? (
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--color-primario)]"
                checked={reactivar}
                onChange={(evento) => setReactivar(evento.target.checked)}
              />
              <span>
                Marcar también el equipo {equipoCodigo} como funcional (es su última incidencia
                pendiente).
              </span>
            </label>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setConfirmandoCierre(false)}>
              Cancelar
            </Boton>
            <Boton
              cargando={cargando}
              onClick={() => ejecutar('cerrar', ofrecerReactivar && reactivar ? { equipoFuncional: true } : undefined)}
            >
              Cerrar incidencia
            </Boton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
