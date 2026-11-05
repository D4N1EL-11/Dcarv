const TONOS = {
  neutro: 'border-borde bg-superficie-alta text-texto-suave',
  funcional: 'border-funcional/35 bg-funcional/10 text-funcional',
  reparacion: 'border-reparacion/35 bg-reparacion/10 text-reparacion',
  baja: 'border-baja/35 bg-baja/10 text-baja',
  revision: 'border-revision/35 bg-revision/10 text-revision',
};

export type TonoInsignia = keyof typeof TONOS;

// Estado con punto de color + texto: el significado nunca depende solo del color.
export function Insignia({ tono = 'neutro', texto }: { tono?: TonoInsignia; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONOS[tono]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {texto}
    </span>
  );
}
