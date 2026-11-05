export function EstadoVacio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-borde bg-superficie/50 p-10 text-center">
      <p className="font-titulo text-xl font-semibold text-primario">{titulo}</p>
      {children ? <div className="mt-2 text-sm text-texto-suave">{children}</div> : null}
    </div>
  );
}
