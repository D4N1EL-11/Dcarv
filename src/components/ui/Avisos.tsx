'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Icono } from './Icono';

type TipoAviso = 'exito' | 'error' | 'info';
type Aviso = { id: number; tipo: TipoAviso; texto: string };
type Contexto = { mostrar: (tipo: TipoAviso, texto: string) => void };

const ContextoAvisos = createContext<Contexto>({ mostrar: () => undefined });
const DURACION_MS = 5000;
const MAXIMO_VISIBLES = 3;

const ESTILO: Record<TipoAviso, string> = {
  exito: 'border-funcional/40 text-funcional',
  error: 'border-baja/40 text-baja',
  info: 'border-primario/40 text-primario',
};

// Notificaciones breves tras una acción (guardar, cerrar, asignar…). Viven en el layout de
// /soporte, así que sobreviven al refresco de la página que hace useRefrescar.
// Lectores de pantalla: los de éxito se anuncian con cortesía; los errores, de inmediato.
export function ProveedorAvisos({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(1);

  const quitar = useCallback((id: number) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }, []);

  const mostrar = useCallback((tipo: TipoAviso, texto: string) => {
    const id = siguienteId.current++;
    setAvisos((actuales) => [...actuales, { id, tipo, texto }].slice(-MAXIMO_VISIBLES));
  }, []);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      {/* Sin display: contents en las regiones vivas: algunos lectores pierden el rol con él. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] grid gap-2 sm:left-auto sm:w-96 print:hidden">
        <div role="status" aria-live="polite" className="grid gap-2">
          {avisos.filter((a) => a.tipo !== 'error').map((aviso) => (
            <TarjetaAviso key={aviso.id} aviso={aviso} alCerrar={quitar} />
          ))}
        </div>
        <div role="alert" aria-live="assertive" className="grid gap-2">
          {avisos.filter((a) => a.tipo === 'error').map((aviso) => (
            <TarjetaAviso key={aviso.id} aviso={aviso} alCerrar={quitar} />
          ))}
        </div>
      </div>
    </ContextoAvisos.Provider>
  );
}

function TarjetaAviso({ aviso, alCerrar }: { aviso: Aviso; alCerrar: (id: number) => void }) {
  const [pausado, setPausado] = useState(false);
  useEffect(() => {
    if (pausado) return undefined;
    const temporizador = setTimeout(() => alCerrar(aviso.id), DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [aviso.id, alCerrar, pausado]);

  return (
    <div
      className={`pointer-events-auto flex w-full animate-float-in items-start gap-3 rounded-xl border bg-superficie-alta px-4 py-3 text-sm shadow-2xl shadow-black/50 ${ESTILO[aviso.tipo]}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <Icono nombre={aviso.tipo === 'error' ? 'incidencias' : aviso.tipo === 'exito' ? 'check' : 'ayuda'} className="mt-0.5 size-4" />
      <p className="flex-1 text-texto">{aviso.texto}</p>
      <button
        type="button"
        onClick={() => alCerrar(aviso.id)}
        className="rounded p-0.5 text-texto-suave transition hover:text-texto"
        aria-label="Cerrar notificación"
      >
        <Icono nombre="cerrar" className="size-4" />
      </button>
    </div>
  );
}

export function useAvisos(): Contexto {
  return useContext(ContextoAvisos);
}
