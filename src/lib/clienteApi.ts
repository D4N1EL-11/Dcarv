import { MENSAJES } from '@/lib/reglas/errores';

export type RespuestaApi<T> = { ok: true; datos: T } | { ok: false; codigo: string; mensaje: string };

// La sesión dura 24 h. Si vence con la página abierta, la siguiente acción responde 401: en vez
// de mostrar "Debe iniciar sesión" junto al botón, se lleva al login y luego se vuelve aquí.
function irAlLogin(): void {
  const { pathname, search } = window.location;
  const consulta = new URLSearchParams({ expirada: '1', siguiente: `${pathname}${search}` });
  window.location.assign(`/login?${consulta}`);
}

export async function llamarApi<T = unknown>(
  url: string,
  metodo: 'POST' | 'PATCH' | 'DELETE',
  cuerpo?: unknown,
): Promise<RespuestaApi<T>> {
  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
    });
    if (respuesta.status === 401) {
      irAlLogin();
      return { ok: false, codigo: 'NO_AUTORIZADO', mensaje: MENSAJES.NO_AUTORIZADO };
    }
    const json = (await respuesta.json()) as
      | { ok: true; datos: T }
      | { ok: false; error: { codigo: string; mensaje: string } };
    return json.ok
      ? json
      : { ok: false, codigo: json.error.codigo, mensaje: json.error.mensaje };
  } catch {
    return { ok: false, codigo: 'ERROR_INTERNO', mensaje: MENSAJES.ERROR_INTERNO };
  }
}
