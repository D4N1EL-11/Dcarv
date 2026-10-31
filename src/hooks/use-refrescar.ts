'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

// Vuelve a pedir la página tras una escritura. No usa router.refresh(): con Next 15.5 esa
// llamada dejaba la transición pendiente para siempre en cerca de 1 de cada 3 intentos.
// Navegar a la misma URL con un parámetro nuevo solo vuelve a renderizar la página.
export function useRefrescar() {
  const router = useRouter();
  const [refrescando, iniciar] = useTransition();
  const refrescar = useCallback(
    (parametros: Record<string, string> = {}) => {
      const { pathname, search } = window.location;
      const consulta = new URLSearchParams(search);
      consulta.set('v', Date.now().toString());
      for (const [nombre, valor] of Object.entries(parametros)) consulta.set(nombre, valor);
      iniciar(() => router.replace(`${pathname}?${consulta}`, { scroll: false }));
    },
    [router],
  );
  return { refrescar, refrescando };
}
