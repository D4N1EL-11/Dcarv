import Link from 'next/link';
import { Icono, type NombreIcono } from '@/components/ui/Icono';

type Props = {
  etiqueta: string;
  titulo: string;
  descripcion?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
};

const FUNCIONES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: 'salas', titulo: 'Inventario por sala', texto: 'Cada equipo con su código y su estado, siempre al día.' },
  { icono: 'incidencias', titulo: 'Incidencias con número de caso', texto: 'Reporte, asignación a un técnico e historial completo.' },
  { icono: 'alertas', titulo: 'Alertas de fallas repetidas', texto: 'Los equipos candidatos a baja aparecen solos.' },
  { icono: 'grafico', titulo: 'Panel de disponibilidad', texto: 'Cuántos equipos sirven antes de cada clase.' },
];

function Monograma({ grande = false }: { grande?: boolean }) {
  return (
    <span
      className={`grid place-items-center rounded-full border border-primario/50 font-titulo font-semibold text-primario ${grande ? 'size-12 text-2xl' : 'size-10 text-xl'}`}
    >
      D
    </span>
  );
}

// Marco común de las pantallas de acceso. En escritorio, pantalla dividida: a la izquierda qué es
// el sistema; a la derecha el formulario. En celular, solo el formulario.
export function MarcoAcceso({ etiqueta, titulo, descripcion, children, pie }: Props) {
  return (
    <main className="grid min-h-screen bg-fondo text-texto lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden border-r border-borde bg-superficie lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_178_106/0.12),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(var(--color-texto)_1px,transparent_1px),linear-gradient(90deg,var(--color-texto)_1px,transparent_1px)] [background-size:48px_48px]"
        />

        <div className="relative flex items-center gap-3">
          <Monograma />
          <span className="font-titulo text-xl font-semibold tracking-wide text-primario">Soporte de Salas</span>
        </div>

        <div className="relative grid max-w-lg gap-8">
          <div className="grid gap-4">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-texto-suave">
              Salas de cómputo
            </p>
            <p className="font-titulo text-5xl font-medium leading-[1.05] text-texto">
              Control de calidad y soporte técnico, <span className="text-primario">en un solo lugar.</span>
            </p>
            <div aria-hidden="true" className="h-px w-16 bg-primario/70" />
          </div>
          <ul className="grid gap-5">
            {FUNCIONES.map((funcion) => (
              <li key={funcion.titulo} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-borde bg-superficie-alta text-primario">
                  <Icono nombre={funcion.icono} className="size-5" />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium text-texto">{funcion.titulo}</span>
                  <span className="text-sm text-texto-suave">{funcion.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-texto-suave">
          Proyecto académico · Lógica y Programación · Universidad Sergio Arboleda
        </p>
      </aside>

      <div className="relative grid place-items-center overflow-hidden px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-14rem] h-[32rem] w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(212_178_106/0.1),transparent)] lg:hidden"
        />
        <div className="relative w-full max-w-[25rem] animate-float-in">
          <Link href="/login" className="mx-auto mb-10 flex w-fit flex-col items-center gap-3 lg:hidden" aria-label="Soporte de Salas">
            <Monograma grande />
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.4em] text-texto-suave">
              Soporte de Salas
            </span>
          </Link>

          <section className="rounded-2xl border border-borde bg-superficie/70 p-7 shadow-2xl shadow-black/40 backdrop-blur sm:p-9 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-texto-suave">{etiqueta}</p>
            <h1 className="mt-3 text-4xl font-medium leading-tight">{titulo}</h1>
            <div aria-hidden="true" className="mt-4 h-px w-12 bg-primario/70" />
            {descripcion ? <p className="mt-4 text-sm leading-relaxed text-texto-suave">{descripcion}</p> : null}
            {children}
          </section>

          {pie ? <div className="mt-6 text-center text-sm text-texto-suave lg:text-left">{pie}</div> : null}
          <p className="mt-10 flex items-center justify-center gap-2 text-xs text-texto-suave lg:justify-start">
            <Icono nombre="escudo" className="size-3.5" /> Acceso para personal de soporte · la sesión dura 24 horas
          </p>
        </div>
      </div>
    </main>
  );
}

export const CLASES_ENLACE_DORADO =
  'font-medium text-primario underline-offset-4 transition hover:text-primario-fuerte hover:underline';
