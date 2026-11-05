'use client';

import { useEffect } from 'react';
import { guardarVistosEnNavegador } from '@/lib/alertasVistas';

// Al abrir la página de alertas, los candidatos que hay en pantalla quedan como vistos.
// Se vuelve a guardar si la lista cambia (por ejemplo, tras dar de baja uno aquí mismo).
export function MarcarAlertasVistas({ codigos }: { codigos: string[] }) {
  const clave = JSON.stringify(codigos);
  useEffect(() => {
    guardarVistosEnNavegador(JSON.parse(clave) as string[]);
  }, [clave]);
  return null;
}
