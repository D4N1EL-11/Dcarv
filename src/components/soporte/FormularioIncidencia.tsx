'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import type { ResultadoIncidencia } from '@/lib/datos/tipos';
import { esquemaIncidencia } from '@/lib/validacion/esquemas';

export function FormularioIncidencia({ codigo }: { codigo: string }) {
  const { refrescar, refrescando } = useRefrescar();
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const problema = esquemaIncidencia.safeParse({ descripcion }).error?.issues[0]?.message;
  const cerrar = useCallback(() => {
    setAbierto(false);
    setDescripcion('');
    setError('');
  }, []);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (problema) {
      setError(problema);
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi<ResultadoIncidencia>(
      `/api/soporte/equipos/${encodeURIComponent(codigo)}/incidencias`,
      'POST',
      { descripcion },
    );
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    cerrar();
    refrescar({ caso: respuesta.datos.incidencia.numeroCaso });
  }

  return (
    <div className="grid gap-3">
      <div>
        <Boton onClick={() => setAbierto(true)}>
          Reportar incidencia
        </Boton>
      </div>
            {abierto ? (
        <Modal titulo={`Reportar incidencia en ${codigo}`} alCerrar={cerrar}>
          <form onSubmit={enviar} className="grid gap-3" noValidate>
            <CampoTexto
              etiqueta="Descripción de la falla"
              value={descripcion}
              maxLength={1000}
              error={descripcion ? problema : error || undefined}
              onChange={(evento) => {
                setDescripcion(evento.target.value);
                setError('');
              }}
            />
            {descripcion && error ? <Aviso tipo="error">{error}</Aviso> : null}
            <div className="flex justify-end">
              <Boton type="submit" cargando={cargando || refrescando}>
                Reportar
              </Boton>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
