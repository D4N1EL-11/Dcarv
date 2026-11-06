'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo, CampoTexto } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import {
  FRECUENCIAS_MANTENIMIENTO,
  LARGO_MAXIMO_NOTAS_MANTENIMIENTO,
  MAXIMO_DIAS_MANTENIMIENTO,
  MINIMO_DIAS_MANTENIMIENTO,
} from '@/lib/config/soporte';
import { plural } from '@/lib/formato';

type Props = { salaId: string; sala: string; cadaDias: number | null; hoy: string };

const OTRA = 'otra';

function textoFrecuencia(dias: number): string {
  if (dias === 7) return 'Cada semana (7 días)';
  if (dias === 15) return 'Cada quince días';
  if (dias === 30) return 'Cada mes (30 días)';
  if (dias === 60) return 'Cada dos meses (60 días)';
  if (dias === 90) return 'Cada tres meses (90 días)';
  if (dias === 180) return 'Cada seis meses (180 días)';
  return `Cada ${plural(dias, 'día', 'días')}`;
}

function RegistrarMantenimiento({ salaId, sala, hoy, alCerrar }: Omit<Props, 'cadaDias'> & { alCerrar: () => void }) {
  const { mostrar } = useAvisos();
  const { refrescar } = useRefrescar();
  const [fecha, setFecha] = useState(hoy);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    const respuesta = await llamarApi('/api/soporte/mantenimiento', 'POST', { salaId, fecha, notas });
    setGuardando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    mostrar('exito', `Mantenimiento de ${sala} registrado.`);
    alCerrar();
    refrescar();
  }

  return (
    <Modal titulo={`Registrar mantenimiento · ${sala}`} alCerrar={alCerrar}>
      <form onSubmit={enviar} className="grid gap-4" noValidate>
        <Campo etiqueta="Fecha en que se hizo" type="date" value={fecha} max={hoy} required onChange={(e) => setFecha(e.target.value)} />
        <CampoTexto
          etiqueta="Qué se hizo (opcional)"
          placeholder="Ej.: Limpieza interna, actualización de Windows y revisión de cables en los 20 equipos."
          rows={3}
          maxLength={LARGO_MAXIMO_NOTAS_MANTENIMIENTO}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        <p className="-mt-2 text-xs text-texto-suave">
          La próxima revisión se cuenta desde esta fecha. {notas.length}/{LARGO_MAXIMO_NOTAS_MANTENIMIENTO}
        </p>
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            Registrar
          </Boton>
        </div>
      </form>
    </Modal>
  );
}

function ProgramarMantenimiento({ salaId, sala, cadaDias, alCerrar }: Omit<Props, 'hoy'> & { alCerrar: () => void }) {
  const { mostrar } = useAvisos();
  const { refrescar } = useRefrescar();
  const sugerida = (FRECUENCIAS_MANTENIMIENTO as readonly number[]).includes(cadaDias ?? 30);
  const [opcion, setOpcion] = useState(sugerida ? String(cadaDias ?? 30) : OTRA);
  const [otra, setOtra] = useState(sugerida ? '' : String(cadaDias ?? ''));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(dias: number | null) {
    setGuardando(true);
    setError('');
    const respuesta = await llamarApi('/api/soporte/mantenimiento/plan', 'POST', { salaId, cadaDias: dias });
    setGuardando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    mostrar('exito', dias === null ? `${sala} quedó sin plan de mantenimiento.` : `${sala}: mantenimiento ${textoFrecuencia(dias).toLowerCase()}.`);
    alCerrar();
    refrescar();
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const dias = opcion === OTRA ? Number(otra) : Number(opcion);
    if (!Number.isInteger(dias) || dias < MINIMO_DIAS_MANTENIMIENTO || dias > MAXIMO_DIAS_MANTENIMIENTO) {
      setError(`Escriba un número entero de días entre ${MINIMO_DIAS_MANTENIMIENTO} y ${MAXIMO_DIAS_MANTENIMIENTO}.`);
      return;
    }
    void guardar(dias);
  }

  return (
    <Modal titulo={`Programar mantenimiento · ${sala}`} alCerrar={alCerrar}>
      <form onSubmit={enviar} className="grid gap-4" noValidate>
        <Selector
          etiqueta="Frecuencia"
          value={opcion}
          onChange={(e) => {
            setOpcion(e.target.value);
            setError('');
          }}
          opciones={[
            ...FRECUENCIAS_MANTENIMIENTO.map((d) => ({ valor: String(d), texto: textoFrecuencia(d) })),
            { valor: OTRA, texto: 'Otra cantidad de días' },
          ]}
        />
        {opcion === OTRA ? (
          <Campo
            etiqueta="Cada cuántos días"
            type="number"
            inputMode="numeric"
            min={MINIMO_DIAS_MANTENIMIENTO}
            max={MAXIMO_DIAS_MANTENIMIENTO}
            value={otra}
            autoFocus
            onChange={(e) => {
              setOtra(e.target.value);
              setError('');
            }}
          />
        ) : null}
        <p className="text-sm text-texto-suave">
          {cadaDias === null
            ? 'La cuenta empieza hoy: la primera revisión vence al cumplirse la frecuencia, o antes si registra un mantenimiento.'
            : 'Si la sala ya tiene mantenimientos registrados, la próxima fecha se cuenta desde el último.'}
        </p>
        {error ? <Aviso tipo="error">{error}</Aviso> : null}
        <div className="flex flex-wrap justify-between gap-2">
          {cadaDias !== null ? (
            <Boton variante="peligro" disabled={guardando} onClick={() => void guardar(null)}>
              Quitar plan
            </Boton>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={alCerrar}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={guardando}>
              Guardar
            </Boton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Acciones de una sala en la página de mantenimiento: registrar uno hecho y programar la frecuencia.
export function AccionesMantenimiento({ salaId, sala, cadaDias, hoy }: Props) {
  const [abierto, setAbierto] = useState<'registrar' | 'programar' | null>(null);
  const cerrar = () => setAbierto(null);
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Boton variante={cadaDias === null ? 'secundario' : 'primario'} onClick={() => setAbierto('registrar')}>
        Registrar
      </Boton>
      <Boton variante="secundario" onClick={() => setAbierto('programar')}>
        {cadaDias === null ? 'Programar' : 'Frecuencia'}
      </Boton>
      {abierto === 'registrar' ? <RegistrarMantenimiento salaId={salaId} sala={sala} hoy={hoy} alCerrar={cerrar} /> : null}
      {abierto === 'programar' ? (
        <ProgramarMantenimiento salaId={salaId} sala={sala} cadaDias={cadaDias} alCerrar={cerrar} />
      ) : null}
    </div>
  );
}
