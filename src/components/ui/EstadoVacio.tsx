export function EstadoVacio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-borde bg-superficie p-8 text-center">
      <p className="font-semibold text-texto">{titulo}</p>
      {children ? <div className="mt-2 text-sm text-texto-suave">{children}</div> : null}
    </div>
  );
}
