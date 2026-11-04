type Props = { funcionales: number; enReparacion: number; dadosDeBaja: number };

// Apoyo visual: las cifras siempre se muestran también como texto junto a la barra.
export function BarraDisponibilidad({ funcionales, enReparacion, dadosDeBaja }: Props) {
  const total = funcionales + enReparacion + dadosDeBaja;
  const ancho = (cantidad: number) => `${total ? (cantidad / total) * 100 : 0}%`;
  return (
    <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-borde">
      <span className="bg-funcional" style={{ width: ancho(funcionales) }} />
      <span className="bg-reparacion" style={{ width: ancho(enReparacion) }} />
      <span className="bg-baja" style={{ width: ancho(dadosDeBaja) }} />
    </div>
  );
}
