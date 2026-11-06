import type { Metadata } from 'next';
import { clasesBoton } from '@/components/ui/Boton';

export const metadata: Metadata = {
  title: 'Sin conexión · Soporte de Salas',
  robots: { index: false, follow: false },
};

// La muestra el service worker (public/sw.js) cuando una página no carga por falta de red. Es
// estática y no tiene datos: se guarda en el dispositivo (con sus estilos) al instalar la app.
// Funciona sin JavaScript: sin red, los scripts de la app no cargan.
export const dynamic = 'force-static';

export default function SinConexion() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-fondo px-6 text-center text-texto">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[30rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(212_178_106/0.1),transparent)]"
      />
      <div className="relative grid justify-items-center gap-5">
        <span className="grid size-12 place-items-center rounded-full border border-primario/50 font-titulo text-2xl font-semibold text-primario">
          D
        </span>
        <h1 className="text-4xl font-medium">Sin conexión</h1>
        <p className="max-w-sm text-sm text-texto-suave">
          No hay conexión a internet. Soporte de Salas necesita red para mostrar datos actualizados; cuando vuelva
          la conexión, intente de nuevo.
        </p>
        {/* Un formulario GET sin destino vuelve a pedir la misma dirección: recarga sin JavaScript. */}
        <form method="get">
          <button type="submit" className={clasesBoton()}>
            Intentar de nuevo
          </button>
        </form>
      </div>
    </main>
  );
}
