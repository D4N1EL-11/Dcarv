import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NavegacionSoporte } from '@/components/soporte/NavegacionSoporte';
import { obtenerSesion } from '@/lib/auth/sesion';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Panel · Soporte de Salas', template: '%s · Soporte de Salas' },
};

// El contador del menú es informativo: si la consulta falla, la navegación sigue funcionando.
async function contarAlertas(): Promise<number> {
  try {
    return (await candidatosDeLaPeticion()).length;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export default async function LayoutSoporte({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  const alertas = await contarAlertas();
  return (
    <div className="min-h-screen bg-fondo text-texto">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-superficie focus:px-4 focus:py-2 focus:font-semibold focus:text-primario"
      >
        Saltar al contenido
      </a>
      <NavegacionSoporte email={sesion.email} alertas={alertas} />
      <main id="contenido" tabIndex={-1} className="mx-auto grid max-w-6xl gap-10 px-4 py-10 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
