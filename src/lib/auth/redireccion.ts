export const DESTINO_POR_DEFECTO = '/soporte';

// Destino tras iniciar sesión. Solo se aceptan rutas internas del módulo para evitar
// redirecciones abiertas (?siguiente=https://otro-sitio o //otro-sitio).
export function rutaSegura(siguiente: string | null | undefined): string {
  if (!siguiente || siguiente.includes('\\')) return DESTINO_POR_DEFECTO;
  return /^\/soporte(?:[/?#]|$)/.test(siguiente) ? siguiente : DESTINO_POR_DEFECTO;
}
