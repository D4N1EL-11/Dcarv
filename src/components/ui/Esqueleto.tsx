// Esqueletos de carga: cada pestaña muestra la forma de su propio contenido mientras el
// servidor consulta la base, en vez de una pantalla en blanco o la silueta de otra página.
const BLOQUE = 'animate-pulse rounded-xl bg-superficie-alta motion-reduce:animate-none';

export function Bloque({ className }: { className: string }) {
  return <div className={`${BLOQUE} ${className}`} />;
}

export function EsqueletoPagina({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-10">
      <span className="sr-only">Cargando información…</span>
      <div className="grid gap-4">
        <Bloque className="h-3 w-40" />
        <Bloque className="h-11 w-72 max-w-full" />
      </div>
      {children}
    </div>
  );
}

export function EsqueletoTarjetas({ cantidad, alto, columnas }: { cantidad: number; alto: string; columnas: string }) {
  return (
    <div className={`grid gap-4 ${columnas}`}>
      {Array.from({ length: cantidad }, (_, i) => (
        <Bloque key={i} className={alto} />
      ))}
    </div>
  );
}
