import { Icono, type NombreIcono } from './Icono';

export function EstadoVacio({
  titulo,
  children,
  icono = 'vacio',
}: {
  titulo: string;
  children?: React.ReactNode;
  icono?: NombreIcono;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-borde bg-superficie/50 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-borde bg-superficie-alta text-texto-suave">
        <Icono nombre={icono} className="size-5" />
      </span>
      <p className="font-titulo text-xl font-semibold text-primario">{titulo}</p>
      {children ? <div className="max-w-md text-sm text-texto-suave">{children}</div> : null}
    </div>
  );
}
