import Link from 'next/link';
import { clasesBoton } from '@/components/ui/Boton';

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-fondo px-6 text-center text-texto">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-12rem] h-[30rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(212_178_106/0.1),transparent)]"
      />
      <div className="relative grid animate-float-in justify-items-center gap-5">
        <span className="grid size-12 place-items-center rounded-full border border-primario/50 font-titulo text-2xl font-semibold text-primario">
          D
        </span>
        <p className="font-titulo text-8xl font-medium leading-none text-primario/90">404</p>
        <h1 className="text-3xl font-medium">Esta página no existe</h1>
        <p className="max-w-sm text-sm text-texto-suave">
          La dirección no corresponde a ninguna pantalla de Soporte de Salas. Revise el enlace o vuelva
          al panel.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link href="/soporte" className={clasesBoton()}>
            Ir al panel
          </Link>
          <Link href="/soporte/ayuda" className={clasesBoton('secundario')}>
            Ayuda
          </Link>
        </div>
      </div>
    </main>
  );
}
