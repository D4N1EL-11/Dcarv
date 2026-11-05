// Íconos de trazo propios (24×24, sin dependencias). Siempre decorativos: el texto vecino
// o un aria-label en el control dicen qué significan.
const TRAZOS = {
  panel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  incidencias: 'M12 3l9 16H3zM12 10v4M12 17h.01',
  salas: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01',
  tecnicos: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  alertas: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  exportar: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  imprimir: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z',
  ayuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01',
  usuario: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  salir: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  cerrar: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  equipo: 'M3 4h18v12H3zM8 20h8M12 16v4',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  traslado: 'M4 7h13l-3-3M20 17H7l3 3',
  llave: 'M8 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM12 12h9M18 12v3M21 12v3',
  vacio: 'M3 13h5l2 3h4l2-3h5M5.5 5h13L21 13v6H3v-6z',
  abajo: 'M6 9l6 6 6-6',
  derecha: 'M9 6l6 6-6 6',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  escudo: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  grafico: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, className = 'size-4' }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
