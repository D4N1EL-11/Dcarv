'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { llamarApi } from '@/lib/clienteApi';
import { GUIAS_SUGERIDAS } from '@/lib/config/soporte';
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_PRIORIDAD,
  type CategoriaIncidencia,
  type PrioridadIncidencia,
} from '@/lib/reglas/clasificacion';

type Guia = { id: string; titulo: string };
type Sugerencia = { categoria: CategoriaIncidencia; prioridad: PrioridadIncidencia; motivo: string };

const ESPERA_MS = 900; // se consulta cuando la persona deja de escribir
const MINIMO = 12;

type Props = {
  descripcion: string;
  soporte: boolean;
  iaDisponible: boolean;
  alAplicar: (categoria: CategoriaIncidencia, prioridad: PrioridadIncidencia) => void;
};

// Mientras se describe la falla: guías de la base de conocimiento que podrían resolverla y, con
// el asistente de IA configurado, el tipo de falla (y la prioridad, para soporte) sugeridos.
export function AyudaReporte({ descripcion, soporte, iaDisponible, alAplicar }: Props) {
  const [guias, setGuias] = useState<Guia[]>([]);
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);
  const [pensando, setPensando] = useState(false);
  const [aplicada, setAplicada] = useState(false);
  const turno = useRef(0);

  useEffect(() => {
    const texto = descripcion.trim();
    if (texto.length < MINIMO) {
      setGuias([]);
      setSugerencia(null);
      return undefined;
    }
    const temporizador = window.setTimeout(async () => {
      const mio = ++turno.current; // si la persona sigue escribiendo, vale la última consulta
      setAplicada(false);
      try {
        const respuesta = await fetch(`/api/soporte/conocimiento?${new URLSearchParams({ q: texto, limite: String(GUIAS_SUGERIDAS) })}`);
        const json = (await respuesta.json()) as { ok: boolean; datos?: Guia[] };
        if (mio === turno.current) setGuias(json.ok && json.datos ? json.datos : []);
      } catch {
        // Sin red: el reporte sigue funcionando sin sugerencias.
      }
      if (!iaDisponible) return;
      setPensando(true);
      const ia = await llamarApi<Sugerencia>('/api/soporte/ia/clasificar', 'POST', { descripcion: texto });
      if (mio !== turno.current) return;
      setPensando(false);
      setSugerencia(ia.ok ? ia.datos : null);
    }, ESPERA_MS);
    return () => window.clearTimeout(temporizador);
  }, [descripcion, iaDisponible]);

  if (!guias.length && !sugerencia && !pensando) return null;

  return (
    <div className="grid gap-3 rounded-xl border border-primario/30 bg-primario-suave p-4" aria-live="polite">
      {guias.length ? (
        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-texto">
            <Icono nombre="libro" className="text-primario" /> Antes de reportar, pruebe estas guías:
          </p>
          <ul className="grid gap-1 pl-6 text-sm">
            {guias.map((g) => (
              <li key={g.id}>
                <Link href={`/soporte/conocimiento/${g.id}`} target="_blank" className="text-primario underline-offset-4 hover:underline">
                  {g.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {pensando ? (
        <p className="flex items-center gap-2 text-sm text-texto-suave">
          <Icono nombre="chispa" className="animate-pulse text-primario" /> El asistente está leyendo la descripción…
        </p>
      ) : sugerencia ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primario/20 pt-3 first:border-0 first:pt-0">
          <p className="grid gap-0.5 text-sm">
            <span className="flex items-center gap-2 font-medium text-texto">
              <Icono nombre="chispa" className="text-primario" />
              Sugerencia del asistente: {ETIQUETA_CATEGORIA[sugerencia.categoria]}
              {soporte ? ` · prioridad ${ETIQUETA_PRIORIDAD[sugerencia.prioridad].toLowerCase()}` : ''}
            </span>
            <span className="pl-6 text-xs text-texto-suave">{sugerencia.motivo}</span>
          </p>
          {aplicada ? (
            <span className="flex items-center gap-1.5 text-sm text-funcional">
              <Icono nombre="check" /> Aplicada
            </span>
          ) : (
            <Boton
              type="button"
              variante="secundario"
              className="px-3 py-1.5"
              onClick={() => {
                alAplicar(sugerencia.categoria, sugerencia.prioridad);
                setAplicada(true);
              }}
            >
              Usar sugerencia
            </Boton>
          )}
        </div>
      ) : null}
    </div>
  );
}
