'use client';

import { esquemaTecnico } from '@/lib/validacion/esquemas';
import { FormularioNombre } from './FormularioNombre';

export function FormularioTecnico() {
  return (
    <FormularioNombre
      url="/api/soporte/tecnicos"
      etiqueta="Nombre del técnico"
      textoBoton="Registrar técnico"
      maximo={100}
      validar={(nombre) => esquemaTecnico.safeParse({ nombre }).error?.issues[0]?.message}
    />
  );
}
