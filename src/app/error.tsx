'use client';

import Link from 'next/link';
import { Boton, clasesBoton } from '@/components/ui/Boton';

// Error inesperado fuera del módulo: sin detalles técnicos (sección 15 del plan).
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-fondo px-6 text-center text-texto">
      <div className="grid animate-float-in justify-items-center gap-5">
        <p className="font-titulo text-7xl font-medium leading-none text-baja">500</p>
        <h1 className="text-3xl font-medium">Algo salió mal</h1>
        <p className="max-w-sm text-sm text-texto-suave">
          Ocurrió un error inesperado. Intente de nuevo; si el problema sigue, vuelva al panel.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Boton onClick={reset}>Reintentar</Boton>
          <Link href="/soporte" className={clasesBoton('secundario')}>
            Ir al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
