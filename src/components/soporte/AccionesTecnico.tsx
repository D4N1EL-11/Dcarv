'use client';

import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import type { ResultadoActividad } from '@/lib/datos/tipos';
import { plural } from '@/lib/formato';
import { esquemaTecnico } from '@/lib/validacion/esquemas';
import { DialogoRenombrar } from './DialogoRenombrar';

type Props = { id: string; nombre: string; activo: boolean; enRevision: number };

function textoResultado({ activo, reasignadas, sinReasignar }: ResultadoActividad): string {
  if (activo) return 'Técnico activado: ya puede recibir casos.';
  const partes = ['Técnico desactivado.'];
  if (reasignadas) partes.push(`${plural(reasignadas, 'caso pasó', 'casos pasaron')} a otros técnicos.`);
  if (sinReasignar) {
    partes.push(
      `${plural(sinReasignar, 'caso sigue', 'casos siguen')} a su nombre porque no hay otro técnico activo.`,
    );
  }
  return partes.join(' ');
}

export function AccionesTecnico({ id, nombre, activo, enRevision }: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const [dialogo, setDialogo] = useState<'renombrar' | 'desactivar' | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const url = `/api/soporte/tecnicos/${id}`;

  async function cambiarActividad(nuevo: boolean) {
    setCargando(true);
    setError('');
    setMensaje('');
    const respuesta = await llamarApi<{ actividad: ResultadoActividad }>(url, 'PATCH', { activo: nuevo });
    setCargando(false);
    setDialogo(null);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setMensaje(textoResultado(respuesta.datos.actividad));
    refrescar();
  }

  const ocupado = cargando || refrescando;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Boton variante="fantasma" className="px-2! py-1! text-xs!" onClick={() => setDialogo('renombrar')}>
          Renombrar
        </Boton>
        {activo ? (
          <Boton
            variante="fantasma"
            className="px-2! py-1! text-xs!"
            disabled={ocupado}
            onClick={() => (enRevision ? setDialogo('desactivar') : cambiarActividad(false))}
          >
            Desactivar
          </Boton>
        ) : (
          <Boton
            variante="fantasma"
            className="px-2! py-1! text-xs!"
            cargando={ocupado}
            onClick={() => cambiarActividad(true)}
          >
            Activar
          </Boton>
        )}
      </div>
      <p role="status" aria-live="polite" className="text-xs text-funcional">
        {mensaje}
      </p>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}

      {dialogo === 'renombrar' ? (
        <DialogoRenombrar
          titulo={`Renombrar a ${nombre}`}
          etiqueta="Nombre del técnico"
          nombreActual={nombre}
          url={url}
          maximo={100}
          validar={(valor) => esquemaTecnico.safeParse({ nombre: valor }).error?.issues[0]?.message}
          alCerrar={() => setDialogo(null)}
        />
      ) : null}

      {dialogo === 'desactivar' ? (
        <Modal titulo={`Desactivar a ${nombre}`} alCerrar={() => setDialogo(null)}>
          <p className="text-sm">
            {nombre} tiene {plural(enRevision, 'caso en revisión', 'casos en revisión')}. Al
            desactivarlo, cada caso pasa al técnico activo con menos carga y su plazo de{' '}
            reasignación vuelve a empezar. No recibirá casos nuevos hasta que lo active otra vez.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setDialogo(null)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={ocupado} onClick={() => cambiarActividad(false)}>
              Desactivar y repartir casos
            </Boton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
