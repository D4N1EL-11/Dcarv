import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NavegacionSoporte } from '@/components/soporte/NavegacionSoporte';
import { Suspense } from 'react';
import { ProveedorAvisos } from '@/components/ui/Avisos';
import { BarraProgreso } from '@/components/ui/BarraProgreso';
import { TransicionPagina } from '@/components/ui/TransicionPagina';
import { COOKIE_ALERTAS_VISTAS, leerVistos } from '@/lib/alertasVistas';
import { obtenerSesion } from '@/lib/auth/sesion';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import { formatearFecha } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Panel · Soporte de Salas', template: '%s · Soporte de Salas' },
  // Módulo interno detrás de inicio de sesión: no debe aparecer en buscadores.
  robots: { index: false, follow: false },
};

// El contador del menú es informativo: si la consulta falla, la navegación sigue funcionando.
async function codigosCandidatos(): Promise<string[]> {
  try {
    return (await candidatosDeLaPeticion()).map((c) => c.codigo);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function PiePagina() {
  return (
    <footer className="mt-16 border-t border-borde print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-texto-suave">
        <p>
          <span className="font-titulo text-sm text-primario">Soporte de Salas</span> · Control de
          calidad y soporte técnico de las salas de cómputo
        </p>
        <p className="flex flex-wrap items-center gap-3">
          <span>Hora de Colombia · {formatearFecha(hoyBogota())}</span>
          <Link href="/soporte/ayuda" className="text-primario underline-offset-4 hover:underline">
            Ayuda y reglas
          </Link>
          <span>
            Atajo de búsqueda: <kbd className="rounded border border-borde px-1">Ctrl K</kbd>
          </span>
        </p>
      </div>
    </footer>
  );
}

export default async function LayoutSoporte({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  const [candidatos, almacen] = await Promise.all([codigosCandidatos(), cookies()]);
  // Las alertas ya vistas se leen aquí para que el número salga bien desde el primer dibujo.
  const vistos = [...leerVistos(almacen.get(COOKIE_ALERTAS_VISTAS)?.value)];
  return (
    <ProveedorAvisos>
      <div className="flex min-h-screen flex-col bg-fondo text-texto">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-superficie focus:px-4 focus:py-2 focus:font-semibold focus:text-primario"
        >
          Saltar al contenido
        </a>
        {/* useSearchParams exige un límite de Suspense. */}
        <Suspense fallback={null}>
          <BarraProgreso />
        </Suspense>
        <NavegacionSoporte email={sesion.email} candidatos={candidatos} vistos={vistos} />
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 focus:outline-none print:max-w-none print:py-0"
        >
          <TransicionPagina>{children}</TransicionPagina>
        </main>
        <PiePagina />
      </div>
    </ProveedorAvisos>
  );
}
