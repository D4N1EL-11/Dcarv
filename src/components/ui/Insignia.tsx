const TONOS = {
  neutro: 'border-borde text-texto-suave',
  funcional: 'border-funcional text-funcional',
  reparacion: 'border-reparacion text-[#8a5a12]',
  baja: 'border-baja text-baja',
  revision: 'border-revision text-revision',
};

export type TonoInsignia = keyof typeof TONOS;

export function Insignia({ tono = 'neutro', texto }: { tono?: TonoInsignia; texto: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-lg border bg-superficie px-2 py-0.5 text-xs font-semibold ${TONOS[tono]}`}
    >
      {texto}
    </span>
  );
}
