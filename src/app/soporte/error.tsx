'use client';

import Link from 'next/link';
import { Boton, clasesBoton } from '@/components/ui/Boton';
import { MENSAJES } from '@/lib/reglas/errores';

// No se muestran detalles técnicos al usuario (sección 15 del plan).
export default function ErrorSoporte({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="grid justify-items-center gap-3 rounded-lg border border-baja bg-superficie p-8 text-center"
    >
      <h1 className="text-xl font-bold text-baja">No se pudo cargar esta página</h1>
      <p className="text-sm text-texto-suave">{MENSAJES.ERROR_INTERNO}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Boton onClick={reset}>Reintentar</Boton>
        <Link href="/soporte" className={clasesBoton('secundario')}>
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
