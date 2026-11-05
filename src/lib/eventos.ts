// Aviso de que empieza una navegación hecha por código (router.push), para la barra de progreso.
// Los enlaces normales se detectan solos; esto cubre la búsqueda global, los filtros, etc.
export const EVENTO_NAVEGANDO = 'soporte:navegando';

export function avisarNavegacion(): void {
  window.dispatchEvent(new Event(EVENTO_NAVEGANDO));
}
