const TAMANOS = { sm: 'size-4', md: 'size-6', lg: 'size-10' };

type Props = {
  size?: keyof typeof TAMANOS;
  className?: string;
  // Solo: anuncia "Cargando" (pantalla de carga). Dentro de un botón es decorativo: el botón ya
  // tiene texto y aria-busy.
  decorativo?: boolean;
};

// Indicador de carga. En los botones gira junto al texto, que se mantiene para que el botón no
// cambie de ancho ni de significado mientras espera.
export function Spinner({ size = 'md', className = '', decorativo = false }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 animate-spin ${TAMANOS[size]} ${className}`}
      {...(decorativo ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Cargando' })}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
