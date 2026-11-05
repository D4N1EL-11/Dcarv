'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';

type Props = { codigo: string; salaActualId: string; salas: { id: string; nombre: string }[] };

// Cambia el equipo de sala conservando código, estado e historial.
export function TrasladarEquipo({ codigo, salaActualId, salas }: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const [salaId, setSalaId] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const destinos = salas.filter((s) => s.id !== salaActualId);

  async function trasladar() {
    if (!salaId) {
      setError('Seleccione la sala de destino.');
      return;
    }
    setCargando(true);
    setError('');
    const respuesta = await llamarApi<{ sala: string }>(
      `/api/soporte/equipos/${encodeURIComponent(codigo)}`,
      'PATCH',
      { salaId },
    );
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setAbierto(false);
    setSalaId('');
    mostrar('exito', `${codigo} ahora está en ${respuesta.datos.sala}.`);
    refrescar();
  }

  if (!destinos.length) return null;

  return (
    <>
      <Boton variante="secundario" onClick={() => setAbierto(true)} className="gap-2">
        <Icono nombre="traslado" /> Trasladar
      </Boton>
      {abierto ? (
        <Modal titulo={`Trasladar ${codigo}`} alCerrar={() => setAbierto(false)}>
          <div className="grid gap-4">
            <p className="text-sm text-texto-suave">
              El equipo conserva su código, su estado y todo su historial de incidencias.
            </p>
            <Selector
              etiqueta="Sala de destino"
              value={salaId}
              onChange={(evento) => {
                setSalaId(evento.target.value);
                setError('');
              }}
              opciones={[
                { valor: '', texto: 'Seleccione una sala' },
                ...destinos.map((s) => ({ valor: s.id, texto: s.nombre })),
              ]}
            />
            {error ? (
              <p role="alert" className="text-sm text-baja">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </Boton>
              <Boton cargando={cargando || refrescando} onClick={trasladar}>
                Trasladar equipo
              </Boton>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
