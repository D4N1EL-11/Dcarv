'use client';

import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { ESTADOS_EQUIPO } from '@/lib/config/soporte';
import { etiquetaEstadoEquipo } from '@/lib/formato';
import type { EstadoEquipo } from '@/lib/reglas/equipo';

const OPCIONES = ESTADOS_EQUIPO.map((valor) => ({ valor, texto: etiquetaEstadoEquipo(valor) }));

export function SelectorEstadoEquipo({ codigo, estado }: { codigo: string; estado: EstadoEquipo }) {
  const { refrescar, refrescando } = useRefrescar();
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState('');

  // El mensaje de confirmación desaparece solo a los pocos segundos.
  useEffect(() => {
    if (!hecho) return undefined;
    const temporizador = setTimeout(() => setHecho(''), 4000);
    return () => clearTimeout(temporizador);
  }, [hecho]);

  async function cambiar(nuevo: EstadoEquipo) {
    setCargando(true);
    setError('');
    setHecho('');
    const respuesta = await llamarApi(
      `/api/soporte/equipos/${encodeURIComponent(codigo)}/estado`,
      'PATCH',
      { estado: nuevo },
    );
    setCargando(false);
    setConfirmando(false);
    if (respuesta.ok) {
      setHecho(`Ahora: ${etiquetaEstadoEquipo(nuevo)}`);
      refrescar();
    } else {
      setError(respuesta.mensaje);
    }
  }

  return (
    <div className="grid gap-1">
      <Selector
        etiqueta={`Cambiar estado de ${codigo}`}
        ocultarEtiqueta
        opciones={OPCIONES}
        value={estado}
        disabled={cargando || refrescando}
        onChange={(evento) => {
          const nuevo = evento.target.value as EstadoEquipo;
          if (nuevo === estado) return;
          if (nuevo === 'dado_de_baja') setConfirmando(true);
          else void cambiar(nuevo);
        }}
      />
      <p role="status" aria-live="polite" className="min-h-0 text-xs font-semibold text-funcional">
        {hecho}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-baja">
          {error}
        </p>
      ) : null}
      {confirmando ? (
        <Modal titulo="Dar de baja" alCerrar={() => setConfirmando(false)}>
          <p className="text-sm">
            Vas a marcar el equipo {codigo} como dado de baja. Podrás reactivarlo cambiando su
            estado luego.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={cargando} onClick={() => cambiar('dado_de_baja')}>
              Dar de baja
            </Boton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
