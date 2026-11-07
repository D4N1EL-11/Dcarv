'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { llamarApi } from '@/lib/clienteApi';
import type { CategoriaIncidencia } from '@/lib/reglas/clasificacion';
import { FormularioArticulo } from './FormularioArticulo';

type Props = {
  articulo: { id: string; titulo: string; categoria: CategoriaIncidencia; contenido: string; palabrasClave: string };
  soporte: boolean;
};

// "¿Le sirvió?" para todos; editar y eliminar para soporte.
export function AccionesArticulo({ articulo, soporte }: Props) {
  const router = useRouter();
  const { mostrar } = useAvisos();
  const [votado, setVotado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function votar(util: boolean) {
    setVotado(true);
    const respuesta = await llamarApi(`/api/soporte/conocimiento/${articulo.id}/voto`, 'POST', { util });
    if (!respuesta.ok) {
      setVotado(false);
      mostrar('error', respuesta.mensaje);
    }
  }

  async function eliminar() {
    setCargando(true);
    const respuesta = await llamarApi(`/api/soporte/conocimiento/${articulo.id}`, 'DELETE');
    setCargando(false);
    if (!respuesta.ok) {
      mostrar('error', respuesta.mensaje);
      return;
    }
    mostrar('exito', 'La guía se eliminó.');
    router.push('/soporte/conocimiento');
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-5 print:hidden">
      {votado ? (
        <p role="status" className="flex items-center gap-2 text-sm text-funcional">
          <Icono nombre="check" /> Gracias: su respuesta ayuda a ordenar las guías.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm text-texto-suave">
          ¿Le sirvió esta guía?
          <Boton variante="secundario" className="px-3 py-1.5" onClick={() => void votar(true)}>
            Sí
          </Boton>
          <Boton variante="secundario" className="px-3 py-1.5" onClick={() => void votar(false)}>
            No
          </Boton>
        </div>
      )}
      {soporte ? (
        <div className="flex gap-2">
          <Boton variante="secundario" className="gap-2" onClick={() => setEditando(true)}>
            <Icono nombre="editar" /> Editar
          </Boton>
          <Boton variante="peligro" onClick={() => setBorrando(true)}>
            Eliminar
          </Boton>
        </div>
      ) : null}
      {editando ? (
        <Modal titulo="Editar guía" amplio alCerrar={() => setEditando(false)}>
          <FormularioArticulo articulo={articulo} alTerminar={() => setEditando(false)} />
        </Modal>
      ) : null}
      {borrando ? (
        <Modal titulo="Eliminar guía" alCerrar={() => setBorrando(false)}>
          <p className="text-sm">Se eliminará la guía “{articulo.titulo}”. Esta acción no se puede deshacer.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setBorrando(false)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={cargando} onClick={() => void eliminar()}>
              Eliminar
            </Boton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
