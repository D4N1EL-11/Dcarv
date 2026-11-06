'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';

// Aprobar o rechazar una solicitud de acceso de soporte. Aprobar da permisos de gestión, por eso
// pide confirmación: el correo no se verificó al registrarse.
export function DecisionSolicitud({ id, email }: { id: string; email: string }) {
  const { mostrar } = useAvisos();
  const { refrescar, refrescando } = useRefrescar();
  const [confirmando, setConfirmando] = useState<'aprobar' | 'rechazar' | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function decidir(aprobar: boolean) {
    setEnviando(true);
    const respuesta = await llamarApi(`/api/soporte/usuarios/${id}/solicitud`, 'POST', { aprobar });
    setEnviando(false);
    setConfirmando(null);
    if (!respuesta.ok) {
      mostrar('error', respuesta.mensaje);
      return;
    }
    mostrar('exito', aprobar ? `${email} ahora es Soporte técnico.` : `Solicitud de ${email} rechazada; sigue como cuenta de reporte.`);
    refrescar();
  }

  const ocupado = enviando || refrescando;
  return (
    <div className="flex flex-wrap gap-2">
      <Boton onClick={() => setConfirmando('aprobar')} disabled={ocupado}>
        Aprobar
      </Boton>
      <Boton variante="secundario" onClick={() => setConfirmando('rechazar')} disabled={ocupado}>
        Rechazar
      </Boton>
      {confirmando ? (
        <Modal
          titulo={confirmando === 'aprobar' ? 'Aprobar acceso de soporte' : 'Rechazar solicitud'}
          alCerrar={() => setConfirmando(null)}
        >
          <p className="text-sm">
            {confirmando === 'aprobar' ? (
              <>
                <strong className="break-all">{email}</strong> podrá gestionar salas, equipos, técnicos e incidencias.
                El correo no se verifica al registrarse: apruebe solo si sabe que es una persona del equipo.
              </>
            ) : (
              <>
                <strong className="break-all">{email}</strong> seguirá como cuenta de reporte y recibirá un aviso. Podrá
                volver a pedir el acceso desde &quot;Mi cuenta&quot;.
              </>
            )}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setConfirmando(null)}>
              Cancelar
            </Boton>
            <Boton
              variante={confirmando === 'aprobar' ? 'primario' : 'peligro'}
              cargando={enviando}
              onClick={() => void decidir(confirmando === 'aprobar')}
            >
              {confirmando === 'aprobar' ? 'Aprobar' : 'Rechazar'}
            </Boton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
