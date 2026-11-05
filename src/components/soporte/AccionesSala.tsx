'use client';

import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { esquemaSala } from '@/lib/validacion/esquemas';
import { DialogoRenombrar } from './DialogoRenombrar';

type Props = { id: string; nombre: string; totalEquipos: number };

// Corregir el nombre de una sala, o eliminarla si quedó vacía (por ejemplo, creada por error).
// Una sala con equipos no se elimina: los equipos se conservan con su historial (RN-15).
export function AccionesSala({ id, nombre, totalEquipos }: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const [dialogo, setDialogo] = useState<'renombrar' | 'eliminar' | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const url = `/api/soporte/salas/${id}`;

  async function eliminar() {
    setCargando(true);
    setError('');
    const respuesta = await llamarApi(url, 'DELETE');
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setDialogo(null);
    refrescar();
  }

  return (
    <div className="relative z-10 flex flex-wrap gap-2">
      <Boton variante="fantasma" className="px-2! py-1! text-xs!" onClick={() => setDialogo('renombrar')}>
        Renombrar
      </Boton>
      {totalEquipos === 0 ? (
        <Boton variante="fantasma" className="px-2! py-1! text-xs! text-baja!" onClick={() => setDialogo('eliminar')}>
          Eliminar
        </Boton>
      ) : null}

      {dialogo === 'renombrar' ? (
        <DialogoRenombrar
          titulo={`Renombrar ${nombre}`}
          etiqueta="Nombre de la sala"
          nombreActual={nombre}
          url={url}
          maximo={80}
          validar={(valor) => esquemaSala.safeParse({ nombre: valor }).error?.issues[0]?.message}
          alCerrar={() => setDialogo(null)}
        />
      ) : null}

      {dialogo === 'eliminar' ? (
        <Modal titulo={`Eliminar ${nombre}`} alCerrar={() => setDialogo(null)}>
          <p className="text-sm">La sala no tiene equipos. Se eliminará de forma definitiva.</p>
          {error ? (
            <div className="mt-3">
              <Aviso tipo="error">{error}</Aviso>
            </div>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setDialogo(null)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={cargando || refrescando} onClick={eliminar}>
              Eliminar sala
            </Boton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
