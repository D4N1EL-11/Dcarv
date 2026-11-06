// Clave con la que se firman y verifican las sesiones (JWT HS256). La usan jwt.ts (servidor) y el
// middleware (Edge), así que no depende de APIs de Node.
//
// En producción, sin JWT_SECRET no hay sesiones: antes se usaba en silencio una clave de reserva
// escrita en el código, y como el repositorio es público cualquiera habría podido firmar una
// sesión de administrador. La reserva queda solo para desarrollo y pruebas locales.

const RESERVA_SOLO_DESARROLLO = 'development-only-secret-change-me';

export class ErrorConfiguracionSesion extends Error {
  constructor() {
    super('Falta configurar JWT_SECRET: en producción las sesiones no se firman con una clave de reserva.');
    this.name = 'ErrorConfiguracionSesion';
  }
}

/** Texto de la clave según el entorno. Separado para poder probarlo sin tocar process.env. */
export function elegirSecreto(valor: string | undefined, entorno: string | undefined): string {
  const limpio = valor?.trim();
  if (limpio) return limpio;
  if (entorno === 'production') throw new ErrorConfiguracionSesion();
  return RESERVA_SOLO_DESARROLLO;
}

let cache: { texto: string; clave: Uint8Array } | null = null;

// Se calcula al usarse (no al importar el módulo): así `next build`, que corre en modo
// producción sin las variables del servidor, no falla al cargar las rutas.
export function secretoSesion(): Uint8Array {
  const texto = elegirSecreto(process.env.JWT_SECRET, process.env.NODE_ENV);
  if (cache?.texto !== texto) cache = { texto, clave: new TextEncoder().encode(texto) };
  return cache.clave;
}
