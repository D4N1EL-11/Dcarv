import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import {
  ErrorDeNegocio,
  ESTADO_HTTP,
  MENSAJES,
  traducirErrorPostgres,
  type CodigoError,
} from '@/lib/reglas/errores';

const SIN_CACHE = { 'Cache-Control': 'no-store' };

export function responderOk<T>(datos: T, estado = 200): NextResponse {
  return NextResponse.json({ ok: true, datos }, { status: estado, headers: SIN_CACHE });
}

function cuerpoError(codigo: CodigoError, mensaje: string, detalles: unknown): NextResponse {
  return NextResponse.json(
    { ok: false, error: { codigo, mensaje, detalles: detalles ?? null } },
    { status: ESTADO_HTTP[codigo], headers: SIN_CACHE },
  );
}

export function responderError(error: unknown): NextResponse {
  const negocio = error instanceof ErrorDeNegocio ? error : traducirErrorPostgres(error);
  if (negocio) return cuerpoError(negocio.codigo, negocio.message, negocio.detalles);
  if (error instanceof ZodError) {
    return cuerpoError('DATOS_INVALIDOS', MENSAJES.DATOS_INVALIDOS, z.flattenError(error));
  }
  console.error(error);
  return cuerpoError('ERROR_INTERNO', MENSAJES.ERROR_INTERNO, null);
}

export function conManejoDeErrores<C = unknown>(
  manejador: (request: Request, contexto: C) => Promise<Response>,
) {
  return async (request: Request, contexto: C): Promise<Response> => {
    try {
      return await manejador(request, contexto);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}
