import { Icono, type NombreIcono } from './Icono';

type Props = {
  titulo: string;
  valor: string | number;
  detalle?: React.ReactNode;
  icono?: NombreIcono;
  // Color del ícono (el de estado acompaña a la etiqueta; la cifra va siempre en tinta de texto).
  color?: string;
};

// Tarjeta de una cifra (fila de indicadores): etiqueta, valor grande y un detalle. La cifra usa la
// sans y números proporcionales; el color del estado va en el ícono, nunca en el número.
export function Cifra({ titulo, valor, detalle, icono, color = 'text-primario' }: Props) {
  return (
    <div className="grid h-full content-start gap-3 rounded-xl border border-borde bg-superficie p-5 print:break-inside-avoid print:border-black/30">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-texto-suave">{titulo}</span>
        {icono ? (
          <span className={`grid size-8 place-items-center rounded-full bg-superficie-alta ${color}`}>
            <Icono nombre={icono} />
          </span>
        ) : null}
      </span>
      <span className="text-4xl font-semibold leading-none text-texto">{valor}</span>
      {detalle ? <span className="text-xs text-texto-suave">{detalle}</span> : null}
    </div>
  );
}
