'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Spinner } from '@/components/ui/spinner';
import { EVENTO_DATOS_CAMBIARON } from '@/lib/alertasVistas';
import { llamarApi } from '@/lib/clienteApi';
import { AVISOS_EN_CAMPANA, SEGUNDOS_ENTRE_CONSULTAS_AVISOS } from '@/lib/config/soporte';
import type { FilaAviso, ResumenAvisos } from '@/lib/datos/avisos';
import { tiempoRelativo } from '@/lib/formato';
import type { TipoAviso } from '@/lib/reglas/avisos';

export const EVENTO_AVISOS_CAMBIARON = 'soporte:avisos-cambiaron';

const ICONO: Record<TipoAviso, NombreIcono> = {
  reporte_nuevo: 'incidencias',
  caso_asignado: 'tecnicos',
  caso_reasignado: 'tecnicos',
  caso_cerrado: 'check',
  comentario: 'comentario',
  solicitud_soporte: 'escudo',
  solicitud_aprobada: 'escudo',
  solicitud_rechazada: 'escudo',
};

async function pedirAvisos(limite: number): Promise<ResumenAvisos | null> {
  try {
    const respuesta = await fetch(`/api/soporte/avisos?limite=${limite}`, { cache: 'no-store' });
    if (!respuesta.ok) return null;
    const json = (await respuesta.json()) as { ok: boolean; datos?: ResumenAvisos };
    return json.ok && json.datos ? json.datos : null;
  } catch {
    return null; // sin red: se conserva lo último conocido
  }
}

export function FilaDeAviso({ aviso, alAbrir }: { aviso: FilaAviso; alAbrir: (aviso: FilaAviso) => void }) {
  return (
    <Link
      href={aviso.enlace}
      onClick={() => alAbrir(aviso)}
      className={`flex gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-primario-suave ${aviso.leido ? 'opacity-70' : ''}`}
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-superficie-alta text-primario">
        <Icono nombre={ICONO[aviso.tipo] ?? 'campana'} className="size-3.5" />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex items-start gap-2">
          <span className={`text-sm ${aviso.leido ? 'text-texto-suave' : 'font-semibold text-texto'}`}>{aviso.titulo}</span>
          {!aviso.leido ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primario">
              <span className="sr-only">(sin leer)</span>
            </span>
          ) : null}
        </span>
        {aviso.detalle ? <span className="line-clamp-2 text-xs text-texto-suave">{aviso.detalle}</span> : null}
        <time dateTime={aviso.momento} className="text-[0.7rem] text-texto-suave">
          {tiempoRelativo(aviso.momento)}
        </time>
      </span>
    </Link>
  );
}

// Campana del menú: cuántos avisos faltan por leer y los más recientes. El número se actualiza al
// navegar, tras cada acción y cada minuto mientras la pestaña está a la vista.
export function CampanaAvisos({ sinLeerInicial }: { sinLeerInicial: number }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [sinLeer, setSinLeer] = useState(sinLeerInicial);
  const [avisos, setAvisos] = useState<FilaAviso[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const primeraRuta = useRef(true);

  const actualizarNumero = useCallback(async () => {
    const datos = await pedirAvisos(1);
    if (datos) setSinLeer(datos.sinLeer);
  }, []);

  const cargarLista = useCallback(async () => {
    setCargando(true);
    const datos = await pedirAvisos(AVISOS_EN_CAMPANA);
    setCargando(false);
    if (datos) {
      setAvisos(datos.avisos);
      setSinLeer(datos.sinLeer);
    }
  }, []);

  useEffect(() => {
    setAbierto(false);
    if (primeraRuta.current) {
      primeraRuta.current = false; // el servidor ya trajo el número de la primera página
      return;
    }
    void actualizarNumero();
  }, [ruta, actualizarNumero]);

  // Cada minuto con la pestaña visible, y al volver a ella.
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === 'visible') void actualizarNumero();
    }, SEGUNDOS_ENTRE_CONSULTAS_AVISOS * 1000);
    const alVolver = () => {
      if (document.visibilityState === 'visible') void actualizarNumero();
    };
    const recargar = () => void actualizarNumero();
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener(EVENTO_DATOS_CAMBIARON, recargar);
    window.addEventListener(EVENTO_AVISOS_CAMBIARON, recargar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener(EVENTO_DATOS_CAMBIARON, recargar);
      window.removeEventListener(EVENTO_AVISOS_CAMBIARON, recargar);
    };
  }, [actualizarNumero]);

  // Se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    function fuera(evento: MouseEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function escape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  function alternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente) void cargarLista();
  }

  // Abrir un aviso lo marca como leído (sin esperar: la navegación sigue aunque falle).
  function abrir(aviso: FilaAviso) {
    setAbierto(false);
    if (aviso.leido) return;
    setSinLeer((n) => Math.max(0, n - 1));
    setAvisos((lista) => lista?.map((a) => (a.id === aviso.id ? { ...a, leido: true } : a)) ?? null);
    void llamarApi('/api/soporte/avisos/leidos', 'POST', { ids: [aviso.id] });
  }

  async function marcarTodos() {
    setSinLeer(0);
    setAvisos((lista) => lista?.map((a) => ({ ...a, leido: true })) ?? null);
    const respuesta = await llamarApi<{ sinLeer: number }>('/api/soporte/avisos/leidos', 'POST');
    if (respuesta.ok) setSinLeer(respuesta.datos.sinLeer);
  }

  const etiqueta = sinLeer ? `Avisos: ${sinLeer} sin leer` : 'Avisos';

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={etiqueta}
        title={etiqueta}
        onClick={alternar}
        className="relative grid size-9 place-items-center rounded-full border border-borde text-texto-suave transition hover:border-primario/60 hover:text-primario"
      >
        <Icono nombre="campana" />
        {sinLeer > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primario px-1 text-[0.65rem] font-bold leading-5 text-fondo"
          >
            {sinLeer > 99 ? '99+' : sinLeer}
          </span>
        ) : null}
      </button>
      {/* El número también se anuncia a los lectores de pantalla cuando cambia. */}
      <span className="sr-only" role="status" aria-live="polite">
        {sinLeer ? `${sinLeer} ${sinLeer === 1 ? 'aviso sin leer' : 'avisos sin leer'}` : ''}
      </span>
      {abierto ? (
        <div
          role="dialog"
          aria-label="Avisos"
          className="fixed inset-x-3 top-16 z-50 rounded-xl border border-borde bg-superficie p-2 shadow-2xl shadow-black/50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between gap-3 border-b border-borde px-3 pb-2 pt-1">
            <p className="text-sm font-semibold text-texto">Avisos</p>
            {sinLeer > 0 ? (
              <button type="button" onClick={marcarTodos} className="text-xs font-medium text-primario underline-offset-4 hover:underline">
                Marcar todos como leídos
              </button>
            ) : null}
          </div>
          <div className="max-h-[min(26rem,70vh)] overflow-y-auto py-1">
            {avisos === null && cargando ? (
              <p className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-texto-suave">
                <Spinner size="sm" decorativo /> Cargando…
              </p>
            ) : avisos && avisos.length ? (
              avisos.map((aviso) => <FilaDeAviso key={aviso.id} aviso={aviso} alAbrir={abrir} />)
            ) : (
              <p className="px-3 py-6 text-center text-sm text-texto-suave">No tiene avisos todavía.</p>
            )}
          </div>
          <Link
            href="/soporte/avisos"
            onClick={() => setAbierto(false)}
            className="flex items-center justify-center gap-1.5 border-t border-borde px-3 pb-1 pt-2.5 text-sm font-medium text-primario underline-offset-4 hover:underline"
          >
            Ver todos los avisos <Icono nombre="flecha" className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
