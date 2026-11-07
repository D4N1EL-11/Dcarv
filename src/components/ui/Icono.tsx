// Íconos de trazo propios (24×24, sin dependencias). Siempre decorativos: el texto vecino
// o un aria-label en el control dicen qué significan.
const TRAZOS = {
  panel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  incidencias: 'M12 3l9 16H3zM12 10v4M12 17h.01',
  salas: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01',
  tecnicos: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  // Alertas (candidatos a baja): una bandera. La campana es de los avisos.
  alertas: 'M5 21V4M5 4h12l-2.5 4.5L17 13H5',
  campana: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
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
  ojo: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ojoTachado:
    'M3 3l18 18M10.6 5.1Q11.3 5 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  correo: 'M3 5h18v14H3zM3 6l9 7 9-7',
  candado: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  ojoAlerta: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9v3M12 15h.01',
  camara: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  comentario: 'M4 5h16v11H9l-5 4z',
  enviar: 'M4 12l16-8-6 16-3-7z',
  etiqueta: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  informe: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7M9 9h2',
  mantenimiento: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M9 13.5l2 2 4-4',
  celular: 'M7 2h10v20H7zM11 18h2',
  izquierda: 'M15 6l-6 6 6 6',
  prioridad: 'M12 3v12M12 19h.01',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2h-2',
  mapa: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  repuesto: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  monitor: 'M2 4h20v13H2zM8 21h8M12 17v4M6 13l3-3 3 2 5-5',
  pantallaCompleta: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  luna: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  notificacion: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4M19 3l2-2',
  editar: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  estrella: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z',
  libro: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z',
  chispa: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  analitica: 'M3 3v18h18M7 15l4-4 3 3 6-7',
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
