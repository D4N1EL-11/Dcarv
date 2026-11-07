export type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'NO_AUTORIZADO'
  | 'SALA_DUPLICADA'
  | 'SALA_NO_ENCONTRADA'
  | 'CODIGO_DUPLICADO'
  | 'EQUIPO_NO_ENCONTRADO'
  | 'ESTADO_INVALIDO'
  | 'TIENE_DEPENDENCIAS'
  | 'INCIDENCIA_NO_ENCONTRADA'
  | 'INCIDENCIA_NO_ASIGNABLE'
  | 'INCIDENCIA_CERRADA'
  | 'SIN_SOLICITUD'
  | 'TECNICO_DUPLICADO'
  | 'TECNICO_NO_ENCONTRADO'
  | 'SIN_PERMISO'
  | 'USUARIO_NO_ENCONTRADO'
  | 'PUESTO_INVALIDO'
  | 'REPUESTO_DUPLICADO'
  | 'REPUESTO_NO_ENCONTRADO'
  | 'SIN_EXISTENCIAS'
  | 'PUSH_NO_CONFIGURADO'
  | 'ARTICULO_NO_ENCONTRADO'
  | 'YA_CALIFICADA'
  | 'IA_NO_CONFIGURADA'
  | 'IA_NO_DISPONIBLE'
  | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión.',
  SIN_PERMISO: 'Su cuenta solo puede reportar fallas. Esta acción es del equipo de soporte.',
  USUARIO_NO_ENCONTRADO: 'La cuenta no existe.',
  SALA_DUPLICADA: 'Ya existe una sala con ese nombre.',
  SALA_NO_ENCONTRADA: 'La sala no existe.',
  CODIGO_DUPLICADO: 'Ya existe un equipo con ese código.',
  EQUIPO_NO_ENCONTRADO: 'No existe un equipo con ese código.',
  ESTADO_INVALIDO: 'El estado debe ser funcional, en reparación o dado de baja.',
  TIENE_DEPENDENCIAS: 'No se puede eliminar: tiene equipos o incidencias asociadas.',
  INCIDENCIA_NO_ENCONTRADA: 'La incidencia no existe.',
  INCIDENCIA_NO_ASIGNABLE: 'Solo se puede asignar una incidencia que esté abierta.',
  INCIDENCIA_CERRADA: 'El caso está cerrado. Si la falla vuelve, reporte una nueva incidencia.',
  SIN_SOLICITUD: 'La cuenta no tiene una solicitud de soporte pendiente.',
  TECNICO_DUPLICADO: 'Ya existe un técnico con ese nombre.',
  TECNICO_NO_ENCONTRADO: 'El técnico no existe.',
  PUESTO_INVALIDO: 'El puesto está fuera del mapa de la sala.',
  REPUESTO_DUPLICADO: 'Ya existe un repuesto con ese nombre.',
  REPUESTO_NO_ENCONTRADO: 'El repuesto no existe.',
  SIN_EXISTENCIAS: 'No hay existencias suficientes de ese repuesto.',
  PUSH_NO_CONFIGURADO: 'Las notificaciones push no están configuradas en el servidor.',
  ARTICULO_NO_ENCONTRADO: 'La guía no existe.',
  YA_CALIFICADA: 'Este caso ya fue calificado.',
  IA_NO_CONFIGURADA: 'El asistente con IA no está configurado en el servidor.',
  IA_NO_DISPONIBLE: 'El asistente con IA no respondió. Intente de nuevo en un momento.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  SIN_PERMISO: 403,
  USUARIO_NO_ENCONTRADO: 404,
  SALA_DUPLICADA: 409,
  SALA_NO_ENCONTRADA: 404,
  CODIGO_DUPLICADO: 409,
  EQUIPO_NO_ENCONTRADO: 404,
  ESTADO_INVALIDO: 422,
  TIENE_DEPENDENCIAS: 409,
  INCIDENCIA_NO_ENCONTRADA: 404,
  INCIDENCIA_NO_ASIGNABLE: 409,
  INCIDENCIA_CERRADA: 409,
  SIN_SOLICITUD: 409,
  TECNICO_DUPLICADO: 409,
  TECNICO_NO_ENCONTRADO: 404,
  PUESTO_INVALIDO: 422,
  REPUESTO_DUPLICADO: 409,
  REPUESTO_NO_ENCONTRADO: 404,
  SIN_EXISTENCIAS: 409,
  PUSH_NO_CONFIGURADO: 503,
  ARTICULO_NO_ENCONTRADO: 404,
  YA_CALIFICADA: 409,
  IA_NO_CONFIGURADA: 503,
  IA_NO_DISPONIBLE: 502,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  constructor(
    public codigo: CodigoError,
    mensaje?: string,
    public detalles?: unknown,
  ) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorDeNegocio';
  }
}

const POR_RESTRICCION: Record<string, CodigoError> = {
  equipos_codigo_unico: 'CODIGO_DUPLICADO',
  ux_salas_nombre: 'SALA_DUPLICADA',
  ux_tecnicos_nombre: 'TECNICO_DUPLICADO',
  ux_repuestos_nombre: 'REPUESTO_DUPLICADO',
  incidencias_numero_unico: 'ERROR_INTERNO',
};

// Sección 9.4 del plan. Devuelve null si el error no es una violación conocida.
export function traducirErrorPostgres(error: unknown): ErrorDeNegocio | null {
  if (typeof error !== 'object' || error === null) return null;
  const { code, constraint } = error as { code?: unknown; constraint?: unknown };
  if (code === '23503') return new ErrorDeNegocio('TIENE_DEPENDENCIAS');
  if (code === '23514') return new ErrorDeNegocio('DATOS_INVALIDOS');
  if (code === '23505' && typeof constraint === 'string') {
    const codigo = POR_RESTRICCION[constraint];
    return codigo ? new ErrorDeNegocio(codigo) : null;
  }
  return null;
}
