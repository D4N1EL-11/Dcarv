'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';

// "Mi cuenta" de una cuenta de reporte con correo institucional: pedir (o volver a pedir) el
// acceso de soporte. Los administradores reciben un aviso.
export function SolicitarSoporte() {
  const { mostrar } = useAvisos();
  const { refrescar, refrescando } = useRefrescar();
  const [enviando, setEnviando] = useState(false);

  async function solicitar() {
    setEnviando(true);
    const respuesta = await llamarApi('/api/soporte/cuenta/solicitud', 'POST');
    setEnviando(false);
    if (!respuesta.ok) {
      mostrar('error', respuesta.mensaje);
      return;
    }
    mostrar('exito', 'Solicitud enviada. Un administrador la revisará.');
    refrescar();
  }

  return (
    <Boton variante="secundario" onClick={solicitar} cargando={enviando || refrescando}>
      Pedir acceso de soporte
    </Boton>
  );
}
