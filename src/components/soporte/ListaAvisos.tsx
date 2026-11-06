'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import type { FilaAviso } from '@/lib/datos/avisos';
import { EVENTO_AVISOS_CAMBIARON, FilaDeAviso } from './CampanaAvisos';

type Props = { avisos: FilaAviso[]; sinLeer: number; textoVacio: string };

// Lista completa de avisos (/soporte/avisos). Abrir uno lo marca como leído.
export function ListaAvisos({ avisos: iniciales, sinLeer, textoVacio }: Props) {
  const { mostrar } = useAvisos();
  const { refrescar, refrescando } = useRefrescar();
  const [avisos, setAvisos] = useState(iniciales);
  const [marcando, setMarcando] = useState(false);

  function abrir(aviso: FilaAviso) {
    if (aviso.leido) return;
    setAvisos((lista) => lista.map((a) => (a.id === aviso.id ? { ...a, leido: true } : a)));
    void llamarApi('/api/soporte/avisos/leidos', 'POST', { ids: [aviso.id] }).then(() =>
      window.dispatchEvent(new Event(EVENTO_AVISOS_CAMBIARON)),
    );
  }

  async function marcarTodos() {
    setMarcando(true);
    const respuesta = await llamarApi('/api/soporte/avisos/leidos', 'POST');
    setMarcando(false);
    if (!respuesta.ok) {
      mostrar('error', respuesta.mensaje);
      return;
    }
    setAvisos((lista) => lista.map((a) => ({ ...a, leido: true })));
    window.dispatchEvent(new Event(EVENTO_AVISOS_CAMBIARON));
    refrescar();
  }

  if (!avisos.length) return <EstadoVacio titulo={textoVacio} icono="campana" />;

  return (
    <div className="grid gap-3">
      {sinLeer > 0 ? (
        <div className="flex justify-end">
          <Boton variante="secundario" onClick={marcarTodos} cargando={marcando || refrescando}>
            Marcar todos como leídos
          </Boton>
        </div>
      ) : null}
      <ol className="grid gap-1 rounded-xl border border-borde bg-superficie p-2">
        {avisos.map((aviso) => (
          <li key={aviso.id}>
            <FilaDeAviso aviso={aviso} alAbrir={abrir} />
          </li>
        ))}
      </ol>
    </div>
  );
}
