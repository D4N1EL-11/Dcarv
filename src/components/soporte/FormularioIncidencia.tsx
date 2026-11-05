'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { subirFotoIncidencia } from '@/lib/fotoCliente';
import type { ResultadoIncidencia } from '@/lib/datos/tipos';
import type { EstadoEquipo } from '@/lib/reglas/equipo';
import { esquemaIncidencia } from '@/lib/validacion/esquemas';
import { SelectorFoto } from './SelectorFoto';

const MAXIMO = 1000;

// RN-06: se anticipa al usuario qué pasará con el estado del equipo.
const EFECTO: Record<EstadoEquipo, string> = {
  funcional: 'Al reportar, el equipo pasará a "En reparación".',
  en_reparacion: 'El equipo ya está "En reparación"; la incidencia se suma a su historial.',
  dado_de_baja: 'El equipo está dado de baja: la incidencia se registra y el equipo sigue dado de baja.',
};

export function FormularioIncidencia({ codigo, estado }: { codigo: string; estado: EstadoEquipo }) {
  const { refrescar, refrescando } = useRefrescar();
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const { mostrar } = useAvisos();

  const problema = esquemaIncidencia.safeParse({ descripcion }).error?.issues[0]?.message;
  const cerrar = useCallback(() => {
    setAbierto(false);
    setDescripcion('');
    setError('');
    setFoto(null);
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
    if (!respuesta.ok) {
      setCargando(false);
      setError(respuesta.mensaje);
      return;
    }
    const numeroCaso = respuesta.datos.incidencia.numeroCaso;
    // El reporte ya quedó: si la foto falla, se avisa sin perder el caso.
    const subida = foto ? await subirFotoIncidencia(numeroCaso, foto) : null;
    setCargando(false);
    if (subida && !subida.ok) mostrar('error', `${numeroCaso} quedó registrada, pero la foto no se pudo subir: ${subida.mensaje}`);
    cerrar();
    refrescar({ caso: numeroCaso });
  }

  return (
    <>
      <Boton onClick={() => setAbierto(true)}>Reportar incidencia</Boton>
      {abierto ? (
        <Modal titulo={`Reportar incidencia en ${codigo}`} alCerrar={cerrar}>
          <form onSubmit={enviar} className="grid gap-3" noValidate>
            <CampoTexto
              etiqueta="Descripción de la falla"
              placeholder="Ej.: No enciende; la pantalla queda en negro."
              value={descripcion}
              maxLength={MAXIMO}
              autoFocus
              error={descripcion ? problema : error || undefined}
              onChange={(evento) => {
                setDescripcion(evento.target.value);
                setError('');
              }}
            />
            <p className="-mt-2 text-right text-xs text-texto-suave">
              {descripcion.length}/{MAXIMO}
            </p>
            <SelectorFoto archivo={foto} alCambiar={setFoto} deshabilitado={cargando} />
            <p className="text-sm text-texto-suave">{EFECTO[estado]}</p>
            {descripcion && error ? <Aviso tipo="error">{error}</Aviso> : null}
            <div className="flex justify-end gap-2">
              <Boton variante="secundario" onClick={cerrar}>
                Cancelar
              </Boton>
              <Boton type="submit" cargando={cargando || refrescando}>
                Reportar
              </Boton>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
