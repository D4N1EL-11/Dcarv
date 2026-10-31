import { MENSAJES } from '@/lib/reglas/errores';

export type RespuestaApi<T> = { ok: true; datos: T } | { ok: false; codigo: string; mensaje: string };

export async function llamarApi<T = unknown>(
  url: string,
  metodo: 'POST' | 'PATCH',
  cuerpo?: unknown,
): Promise<RespuestaApi<T>> {
  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
    });
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
