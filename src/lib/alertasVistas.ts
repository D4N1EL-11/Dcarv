// "Alertas vistas": al abrir /soporte/alertas se guardan en una cookie los códigos de los
// candidatos a baja que había en ese momento. El número del menú y el aviso del panel solo
// cuentan los candidatos que no están en esa lista (los nuevos). Funciones puras: las usan el
// servidor (para dibujar sin parpadeo) y el navegador (para actualizar al instante).

export const COOKIE_ALERTAS_VISTAS = 'dcarv_alertas_vistas';
// Eventos del navegador: datos que cambiaron tras una acción, y alertas marcadas como vistas.
export const EVENTO_DATOS_CAMBIARON = 'soporte:datos-cambiaron';
export const EVENTO_ALERTAS_VISTAS = 'soporte:alertas-vistas';

// Tope para no pasar el límite de 4 KB de una cookie (códigos de hasta 40 caracteres).
const MAXIMO_CODIGOS = 60;

export function serializarVistos(codigos: string[]): string {
  return encodeURIComponent(JSON.stringify([...new Set(codigos)].slice(0, MAXIMO_CODIGOS)));
}

// Acepta el valor tal como llega (codificado o ya decodificado); cualquier cosa rara = nada visto.
export function leerVistos(valor: string | null | undefined): Set<string> {
  if (!valor) return new Set();
  for (const texto of [valor, safeDecode(valor)]) {
    try {
      const datos: unknown = JSON.parse(texto);
      if (Array.isArray(datos)) {
        return new Set(datos.filter((d): d is string => typeof d === 'string').slice(0, MAXIMO_CODIGOS));
      }
    } catch {
      // Se intenta con la otra forma; si ninguna sirve, nada visto.
    }
  }
  return new Set();
}

function safeDecode(valor: string): string {
  try {
    return decodeURIComponent(valor);
  } catch {
    return '';
  }
}

export function contarSinVer(candidatos: string[], vistos: ReadonlySet<string>): number {
  return candidatos.filter((codigo) => !vistos.has(codigo)).length;
}

// Lectura de la cookie en el navegador (no es httpOnly: solo guarda qué alertas se vieron).
export function leerVistosDelNavegador(): Set<string> {
  const prefijo = `${COOKIE_ALERTAS_VISTAS}=`;
  const fragmento = document.cookie.split('; ').find((parte) => parte.startsWith(prefijo));
  return leerVistos(fragmento?.slice(prefijo.length));
}

export function guardarVistosEnNavegador(codigos: string[]): void {
  const seguro = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${COOKIE_ALERTAS_VISTAS}=${serializarVistos(codigos)}; path=/; max-age=31536000; samesite=lax${seguro}`;
  window.dispatchEvent(new Event(EVENTO_ALERTAS_VISTAS));
}
