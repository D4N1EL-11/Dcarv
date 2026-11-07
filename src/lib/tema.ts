// Tema de la interfaz: oscuro (el de la marca, por defecto) o claro. La preferencia se guarda en
// este navegador; el atributo data-tema de <html> activa la paleta clara de globals.css.

export type Tema = 'oscuro' | 'claro';

export const CLAVE_TEMA = 'soporte:tema';

// Se ejecuta en <head> antes de pintar (layout raíz). Va como texto: no puede importar nada.
export const SCRIPT_TEMA = `try{if(localStorage.getItem('${CLAVE_TEMA}')==='claro')document.documentElement.dataset.tema='claro'}catch(e){}`;

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro';
}

export function aplicarTema(tema: Tema): void {
  if (tema === 'claro') document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento (navegación privada estricta): el tema dura hasta recargar.
  }
}
