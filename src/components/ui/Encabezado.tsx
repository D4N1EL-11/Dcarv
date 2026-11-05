// Encabezado común de cada pestaña: etiqueta pequeña con línea dorada, título en serif y,
// a la derecha, las acciones principales de la página.
export function EncabezadoPagina({
  etiqueta,
  titulo,
  descripcion,
  children,
}: {
  etiqueta: string;
  titulo: string;
  descripcion?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="grid gap-4">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="h-px w-10 bg-primario/70" />
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-texto-suave">{etiqueta}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid max-w-3xl gap-3">
          <h1 className="text-4xl font-medium leading-none break-words sm:text-5xl">{titulo}</h1>
          {descripcion ? <div className="text-sm leading-relaxed text-texto-suave">{descripcion}</div> : null}
        </div>
        {children ? <div className="flex flex-wrap gap-2 print:hidden">{children}</div> : null}
      </div>
    </header>
  );
}

export function TituloSeccion({ id, titulo, children }: { id: string; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-borde pb-3">
      <h2 id={id} className="text-2xl font-medium">
        {titulo}
      </h2>
      {children}
    </div>
  );
}

// Tarjeta con título pequeño para los bloques del panel (gráfico, inventario, actividad).
export function BloquePanel({ titulo, children, className = '' }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`grid content-start gap-4 rounded-xl border border-borde bg-superficie p-5 ${className}`}>
      <h2 className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.2em] text-texto-suave">{titulo}</h2>
      {children}
    </section>
  );
}
