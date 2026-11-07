'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';

// "Cuentas y roles" (solo administradores): eliminar una cuenta, con confirmación.
export function EliminarCuenta({ id, email, reportes }: { id: string; email: string; reportes: number }) {
  const { mostrar } = useAvisos();
  const { refrescar, refrescando } = useRefrescar();
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function eliminar() {
    setCargando(true);
    const respuesta = await llamarApi(`/api/soporte/usuarios/${id}`, 'DELETE');
    setCargando(false);
    if (!respuesta.ok) {
      mostrar('error', respuesta.mensaje);
      return;
    }
    setConfirmando(false);
    mostrar('exito', `La cuenta ${email} se eliminó.`);
    refrescar();
  }

  return (
    <>
      <Boton variante="peligro" className="px-3 py-1.5" disabled={refrescando} onClick={() => setConfirmando(true)}>
        Eliminar
      </Boton>
      {confirmando ? (
        <Modal titulo="Eliminar cuenta" alCerrar={() => setConfirmando(false)}>
          <div className="grid gap-3 text-sm">
            <p>
              Se eliminará la cuenta <strong className="break-all">{email}</strong>. La persona ya no podrá iniciar sesión.
            </p>
            {reportes ? (
              <p className="text-texto-suave">
                Sus {reportes === 1 ? 'reporte se conserva' : `${reportes} reportes se conservan`} en el historial, sin cuenta
                asociada, y sus comentarios mantienen su correo.
              </p>
            ) : null}
            <p className="font-medium text-baja">Esta acción no se puede deshacer.</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={cargando || refrescando} onClick={() => void eliminar()}>
              Eliminar cuenta
            </Boton>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
