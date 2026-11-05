import Link from 'next/link';

type Props = {
  etiqueta: string;
  titulo: string;
  descripcion?: React.ReactNode;
  children: React.ReactNode;
  pie?: React.ReactNode;
};

// Marco común de las pantallas de acceso: fondo oscuro, monograma y título dorados.
export function MarcoAcceso({ etiqueta, titulo, descripcion, children, pie }: Props) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-fondo px-4 py-12 text-texto">
      {/* Halo dorado muy tenue detrás del formulario. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[32rem] w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(212_178_106/0.13),transparent)]"
      />

      <div className="relative w-full max-w-[25rem] animate-float-in">
        <Link href="/login" className="mx-auto mb-10 flex w-fit flex-col items-center gap-3" aria-label="Soporte de Salas">
          <span className="grid size-12 place-items-center rounded-full border border-primario/50 font-titulo text-2xl font-semibold text-primario">
            D
          </span>
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.4em] text-texto-suave">
            Soporte de Salas
          </span>
        </Link>

        <section className="rounded-2xl border border-borde bg-superficie/70 p-7 shadow-2xl shadow-black/40 backdrop-blur sm:p-9">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-texto-suave">{etiqueta}</p>
          <h1 className="mt-3 text-4xl font-medium leading-tight">{titulo}</h1>
          <div aria-hidden="true" className="mt-4 h-px w-12 bg-primario/70" />
          {descripcion ? <p className="mt-4 text-sm leading-relaxed text-texto-suave">{descripcion}</p> : null}
          {children}
        </section>

        {pie ? <div className="mt-6 text-center text-sm text-texto-suave">{pie}</div> : null}
      </div>
    </main>
  );
}

export const CLASES_ENLACE_DORADO =
  'font-medium text-primario underline-offset-4 transition hover:text-primario-fuerte hover:underline';
