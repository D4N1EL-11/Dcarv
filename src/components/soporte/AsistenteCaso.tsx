'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';
import { llamarApi } from '@/lib/clienteApi';

type Sugerencia = {
  causaProbable: string;
  pasos: string[];
  casos: { numeroCaso: string; equipo: string }[];
  guias: { id: string; titulo: string }[];
};
type Resumen = { resumen: string; situacion: string; siguientePaso: string };

// Asistente con IA en la ficha de un caso (solo soporte): sugerir cómo resolverlo a partir de
// casos cerrados parecidos y de las guías, o resumir el caso y su conversación.
export function AsistenteCaso({ numeroCaso }: { numeroCaso: string }) {
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState<'sugerencia' | 'resumen' | null>(null);
  const [error, setError] = useState('');
  const base = `/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}`;

  async function pedir(tipo: 'sugerencia' | 'resumen') {
    setCargando(tipo);
    setError('');
    const respuesta = await llamarApi<Sugerencia | Resumen>(`${base}/${tipo}`, 'POST');
    setCargando(null);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    if (tipo === 'sugerencia') setSugerencia(respuesta.datos as Sugerencia);
    else setResumen(respuesta.datos as Resumen);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        <Boton variante="secundario" className="gap-2" cargando={cargando === 'sugerencia'} disabled={cargando !== null} onClick={() => void pedir('sugerencia')}>
          <Icono nombre="chispa" /> Sugerir solución
        </Boton>
        <Boton variante="secundario" className="gap-2" cargando={cargando === 'resumen'} disabled={cargando !== null} onClick={() => void pedir('resumen')}>
          <Icono nombre="informe" /> Resumir caso
        </Boton>
      </div>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}

      {resumen ? (
        <div className="grid gap-2 rounded-lg bg-superficie-alta p-4 text-sm">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-texto-suave">Resumen</p>
          <p>{resumen.resumen}</p>
          <p>
            <strong className="text-texto">Ahora:</strong> <span className="text-texto-suave">{resumen.situacion}</span>
          </p>
          <p>
            <strong className="text-texto">Siguiente paso:</strong> <span className="text-texto-suave">{resumen.siguientePaso}</span>
          </p>
        </div>
      ) : null}

      {sugerencia ? (
        <div className="grid gap-3 rounded-lg bg-superficie-alta p-4 text-sm">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-texto-suave">Causa probable</p>
          <p>{sugerencia.causaProbable}</p>
          <ol className="grid list-decimal gap-1.5 pl-5 marker:text-primario">
            {sugerencia.pasos.map((paso, i) => (
              <li key={i}>{paso}</li>
            ))}
          </ol>
          {sugerencia.casos.length || sugerencia.guias.length ? (
            <div className="grid gap-1 border-t border-borde pt-3 text-xs text-texto-suave">
              <span>Basado en:</span>
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {sugerencia.casos.map((c) => (
                  <Link key={c.numeroCaso} href={`/soporte/incidencias/${encodeURIComponent(c.numeroCaso)}`} className="text-primario underline-offset-4 hover:underline">
                    {c.numeroCaso} ({c.equipo})
                  </Link>
                ))}
                {sugerencia.guias.map((g) => (
                  <Link key={g.id} href={`/soporte/conocimiento/${g.id}`} className="text-primario underline-offset-4 hover:underline">
                    {g.titulo}
                  </Link>
                ))}
              </span>
            </div>
          ) : null}
          <p className="text-xs text-texto-suave">Generado con IA: revíselo antes de aplicarlo.</p>
        </div>
      ) : null}
    </div>
  );
}
