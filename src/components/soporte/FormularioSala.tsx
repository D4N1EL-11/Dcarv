'use client';

import { esquemaSala } from '@/lib/validacion/esquemas';
import { FormularioNombre } from './FormularioNombre';

export function FormularioSala() {
  return (
    <FormularioNombre
      url="/api/soporte/salas"
      etiqueta="Nombre de la sala"
      textoBoton="Registrar sala"
      maximo={80}
      ejemplo="Ej.: Sala 301 · Bloque B"
      validar={(nombre) => esquemaSala.safeParse({ nombre }).error?.issues[0]?.message}
    />
  );
}
