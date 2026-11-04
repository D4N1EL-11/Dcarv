// Esqueleto mientras el servidor consulta la base: evita una pantalla en blanco.
export default function CargandoSoporte() {
  const bloque = 'animate-pulse rounded-lg bg-borde/60';
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Cargando información...</span>
      <div className={`${bloque} h-8 w-64`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={`${bloque} h-24`} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <div key={n} className={`${bloque} h-32`} />
        ))}
      </div>
      <div className={`${bloque} h-48`} />
    </div>
  );
}
