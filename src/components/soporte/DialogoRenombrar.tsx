'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';

type Props = {
  titulo: string;
  etiqueta: string;
  nombreActual: string;
  url: string;
  maximo: number;
  validar: (nombre: string) => string | undefined;
  alCerrar: () => void;
};

// Cambia el nombre con PATCH { nombre }. La misma validación Zod corre aquí y en la API;
// los duplicados (sin distinguir mayúsculas) los rechaza la base con un índice único.
export function DialogoRenombrar({ titulo, etiqueta, nombreActual, url, maximo, validar, alCerrar }: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const [nombre, setNombre] = useState(nombreActual);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    const problema = validar(nombre);
    if (problema) {
      setError(problema);
      return;
    }
    if (nombre.trim() === nombreActual) {
      alCerrar();
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi(url, 'PATCH', { nombre });
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    alCerrar();
    refrescar();
  }

  return (
    <Modal titulo={titulo} alCerrar={alCerrar}>
      <form onSubmit={guardar} className="grid gap-3" noValidate>
        <Campo
          etiqueta={etiqueta}
          value={nombre}
          maxLength={maximo}
          autoFocus
          onChange={(evento) => {
            setNombre(evento.target.value);
            setError('');
          }}
        />
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={cargando || refrescando}>
            Guardar
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
