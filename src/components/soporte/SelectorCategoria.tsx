'use client';

import { useId } from 'react';
import { CATEGORIAS_INCIDENCIA } from '@/lib/config/soporte';
import { AYUDA_CATEGORIA, ETIQUETA_CATEGORIA, type CategoriaIncidencia } from '@/lib/reglas/clasificacion';

type Props = {
  valor: CategoriaIncidencia | null;
  alCambiar: (categoria: CategoriaIncidencia) => void;
  deshabilitado?: boolean;
};

// Tipo de falla como opciones con ejemplos: quien reporta reconoce su caso sin saber de categorías.
export function SelectorCategoria({ valor, alCambiar, deshabilitado = false }: Props) {
  const nombre = useId();
  return (
    <div role="radiogroup" aria-label="Tipo de falla" className="grid gap-2 sm:grid-cols-2">
      {CATEGORIAS_INCIDENCIA.map((categoria) => {
        const elegida = valor === categoria;
        return (
          <label
            key={categoria}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primario ${
              elegida ? 'border-primario/70 bg-primario-suave' : 'border-borde hover:border-primario/40'
            } ${deshabilitado ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <input
              type="radio"
              name={nombre}
              value={categoria}
              checked={elegida}
              disabled={deshabilitado}
              onChange={() => alCambiar(categoria)}
              className="mt-0.5 size-4 accent-[var(--color-primario)]"
            />
            <span className="grid gap-0.5">
              <span className="text-sm font-medium text-texto">{ETIQUETA_CATEGORIA[categoria]}</span>
              <span className="text-xs text-texto-suave">{AYUDA_CATEGORIA[categoria]}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
