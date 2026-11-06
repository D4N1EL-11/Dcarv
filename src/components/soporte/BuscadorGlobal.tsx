'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import type { ResultadosBusqueda } from '@/lib/datos/busqueda';
import { avisarNavegacion } from '@/lib/eventos';
import { etiquetaEstadoEquipo, etiquetaEstadoIncidencia, plural } from '@/lib/formato';

type Elemento = { clave: string; grupo: string; icono: NombreIcono; titulo: string; detalle: string; href: string };

const ESPERA_MS = 200;

function aplanar(r: ResultadosBusqueda): Elemento[] {
  return [
    ...r.equipos.map((e) => ({
      clave: `e-${e.codigo}`,
      grupo: 'Equipos',
      icono: 'equipo' as const,
      titulo: e.codigo,
      detalle: `${e.sala} · ${etiquetaEstadoEquipo(e.estado)}`,
      href: `/soporte/equipos/${encodeURIComponent(e.codigo)}`,
    })),
    ...r.incidencias.map((i) => ({
      clave: `i-${i.numeroCaso}`,
      grupo: 'Incidencias',
      icono: 'incidencias' as const,
      titulo: `${i.numeroCaso} · ${i.equipoCodigo}`,
      detalle: `${etiquetaEstadoIncidencia(i.estado)} · ${i.descripcion}`,
      href: `/soporte/incidencias/${encodeURIComponent(i.numeroCaso)}`,
    })),
    ...r.salas.map((s) => ({
      clave: `s-${s.id}`,
      grupo: 'Salas',
      icono: 'salas' as const,
      titulo: s.nombre,
      detalle: plural(s.totalEquipos, 'equipo', 'equipos'),
      href: `/soporte?salaId=${s.id}`,
    })),
    ...r.tecnicos.map((t) => ({
      clave: `t-${t.id}`,
      grupo: 'Técnicos',
      icono: 'tecnicos' as const,
      titulo: t.nombre,
      detalle: t.activo ? 'Ver sus casos' : 'Inactivo · ver sus casos',
      href: `/soporte/incidencias?tecnicoId=${t.id}`,
    })),
  ];
}

// No abrir el buscador con "/" mientras se escribe en un campo.
function escribiendoEnCampo(destino: EventTarget | null): boolean {
  const elemento = destino as HTMLElement | null;
  return Boolean(elemento?.closest('input, textarea, select, [contenteditable="true"]'));
}

export function BuscadorGlobal() {
  const router = useRouter();
  const idLista = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [elementos, setElementos] = useState<Elemento[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [activo, setActivo] = useState(0);
  const disparador = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setTexto('');
    setElementos(null);
    setError('');
    disparador.current?.focus();
  }, []);

  // Atajos: Ctrl+K / ⌘+K en cualquier parte; "/" fuera de los campos de texto.
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      const atajo = (evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k';
      if (atajo || (evento.key === '/' && !escribiendoEnCampo(evento.target))) {
        evento.preventDefault();
        setAbierto(true);
      }
    }
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, []);

  useEffect(() => {
    if (!abierto) return undefined;
    campo.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  // Consulta con espera (debounce) y cancelación: solo vale la respuesta del último texto.
  useEffect(() => {
    const consulta = texto.trim();
    if (!abierto || consulta.length < 2) {
      setElementos(null);
      setCargando(false);
      return undefined;
    }
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await fetch(`/api/soporte/buscar?q=${encodeURIComponent(consulta)}`, {
          signal: control.signal,
        });
        if (respuesta.status === 401) {
          const { pathname, search } = window.location;
          window.location.assign(`/login?expirada=1&siguiente=${encodeURIComponent(pathname + search)}`);
          return;
        }
        const json = (await respuesta.json()) as { ok: boolean; datos?: ResultadosBusqueda };
        if (!json.ok || !json.datos) throw new Error('respuesta');
        setElementos(aplanar(json.datos));
        setActivo(0);
      } catch (excepcion) {
        if ((excepcion as Error).name !== 'AbortError') setError('No se pudo buscar. Intente de nuevo.');
      } finally {
        if (!control.signal.aborted) setCargando(false);
      }
    }, ESPERA_MS);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [texto, abierto]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, { elemento: Elemento; indice: number }[]>();
    (elementos ?? []).forEach((elemento, indice) => {
      mapa.set(elemento.grupo, [...(mapa.get(elemento.grupo) ?? []), { elemento, indice }]);
    });
    return [...mapa];
  }, [elementos]);

  function ir(elemento: Elemento | undefined) {
    if (!elemento) return;
    cerrar();
    avisarNavegacion();
    router.push(elemento.href);
  }

  function alTeclear(evento: React.KeyboardEvent<HTMLInputElement>) {
    const total = elementos?.length ?? 0;
    if (evento.key === 'Escape') cerrar();
    else if (evento.key === 'ArrowDown' && total) {
      evento.preventDefault();
      setActivo((i) => (i + 1) % total);
    } else if (evento.key === 'ArrowUp' && total) {
      evento.preventDefault();
      setActivo((i) => (i - 1 + total) % total);
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      ir(elementos?.[activo]);
    }
  }

  const consulta = texto.trim();

  return (
    <>
      <button
        ref={disparador}
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-lg border border-borde px-2.5 py-1.5 text-sm text-texto-suave transition hover:border-primario/60 hover:text-texto"
        aria-label="Buscar (Ctrl+K)"
        aria-haspopup="dialog"
      >
        <Icono nombre="buscar" />
        <span className="hidden lg:inline">Buscar</span>
        <kbd className="hidden rounded border border-borde px-1.5 text-[0.65rem] text-texto-suave lg:inline">Ctrl K</kbd>
      </button>

      {abierto ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) cerrar();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Búsqueda global"
            className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-borde bg-superficie shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-3 border-b border-borde px-4">
              <Icono nombre="buscar" className="size-5 text-texto-suave" />
              <input
                ref={campo}
                type="text"
                role="combobox"
                aria-expanded={Boolean(elementos?.length)}
                aria-controls={idLista}
                aria-activedescendant={elementos?.length ? `${idLista}-${activo}` : undefined}
                aria-autocomplete="list"
                aria-label="Buscar equipos, incidencias, salas o técnicos"
                placeholder="Código de equipo, INC-0001, sala o técnico…"
                value={texto}
                maxLength={60}
                onChange={(evento) => setTexto(evento.target.value)}
                onKeyDown={alTeclear}
                className="h-14 flex-1 bg-transparent text-base text-texto outline-none placeholder:text-texto-suave/60"
              />
              <kbd className="rounded border border-borde px-1.5 text-[0.65rem] text-texto-suave">Esc</kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {consulta.length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-texto-suave">
                  Escriba al menos 2 caracteres. Use ↑ ↓ para moverse y Enter para abrir.
                </p>
              ) : error ? (
                <p role="alert" className="px-3 py-6 text-center text-sm text-baja">{error}</p>
              ) : elementos && !elementos.length && !cargando ? (
                <p className="px-3 py-6 text-center text-sm text-texto-suave">
                  Sin resultados para «{consulta}».
                </p>
              ) : (
                <ul id={idLista} role="listbox" aria-label="Resultados" className={cargando ? 'opacity-60' : ''}>
                  {grupos.map(([grupo, filas]) => (
                    <li key={grupo} role="presentation" className="pb-2">
                      <p className="px-3 pb-1 pt-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-texto-suave">
                        {grupo}
                      </p>
                      <ul role="group" aria-label={grupo}>
                        {filas.map(({ elemento, indice }) => (
                          <li
                            key={elemento.clave}
                            id={`${idLista}-${indice}`}
                            role="option"
                            aria-selected={indice === activo}
                            onMouseMove={() => setActivo(indice)}
                            onClick={() => ir(elemento)}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${indice === activo ? 'bg-primario-suave text-texto' : 'text-texto'}`}
                          >
                            <Icono nombre={elemento.icono} className={`size-4 ${indice === activo ? 'text-primario' : 'text-texto-suave'}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{elemento.titulo}</span>
                              <span className="block truncate text-xs text-texto-suave">{elemento.detalle}</span>
                            </span>
                            {indice === activo ? <Icono nombre="flecha" className="size-4 text-primario" /> : null}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
