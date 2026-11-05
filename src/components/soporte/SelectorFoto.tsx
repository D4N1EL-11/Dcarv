'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '@/components/ui/Icono';

type Props = { archivo: File | null; alCambiar: (archivo: File | null) => void; deshabilitado?: boolean };

// Foto opcional de la falla. En el celular el sistema ofrece tomarla con la cámara o elegirla.
export function SelectorFoto({ archivo, alCambiar, deshabilitado = false }: Props) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [vista, setVista] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo) {
      setVista(null);
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-texto-suave">Foto (opcional)</span>
      {archivo && vista ? (
        <div className="flex items-center gap-3 rounded-lg border border-borde bg-fondo/60 p-2">
          <img src={vista} alt="Vista previa de la foto" className="size-16 rounded-md object-cover" />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-sm text-texto">{archivo.name || 'foto'}</span>
            <span className="text-xs text-texto-suave">Se reduce antes de enviarla.</span>
          </div>
          <button
            type="button"
            disabled={deshabilitado}
            onClick={() => {
              alCambiar(null);
              if (entrada.current) entrada.current.value = '';
            }}
            className="rounded-md px-2 py-1 text-xs font-medium text-baja transition hover:bg-baja/10 disabled:opacity-50"
          >
            Quitar
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-borde px-4 py-3 text-sm text-texto-suave transition hover:border-primario/60 hover:text-primario ${deshabilitado ? 'pointer-events-none opacity-50' : ''}`}
        >
          <span className="grid size-9 place-items-center rounded-full bg-superficie-alta text-primario">
            <Icono nombre="camara" />
          </span>
          <span className="grid">
            <span className="font-medium text-texto">Agregar una foto</span>
            <span className="text-xs">De la pantalla con el error o del equipo. JPG, PNG o WebP.</span>
          </span>
        </label>
      )}
      <input
        ref={entrada}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        disabled={deshabilitado}
        onChange={(evento) => alCambiar(evento.target.files?.[0] ?? null)}
      />
    </div>
  );
}
