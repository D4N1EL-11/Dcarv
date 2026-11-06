// Textos de los avisos de la campana. Funciones puras: lib/datos/avisos.ts los guarda en la misma
// transacción que el cambio que los origina.

export type TipoAviso =
  | 'reporte_nuevo'
  | 'caso_asignado'
  | 'caso_reasignado'
  | 'caso_cerrado'
  | 'comentario'
  | 'solicitud_soporte'
  | 'solicitud_aprobada'
  | 'solicitud_rechazada';

export type NuevoAviso = { tipo: TipoAviso; titulo: string; detalle: string; enlace: string };

const LARGO_DETALLE = 160;

export function recortar(texto: string, largo = LARGO_DETALLE): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length > largo ? `${limpio.slice(0, largo - 1).trimEnd()}…` : limpio;
}

export function enlaceCaso(numeroCaso: string, ancla?: string): string {
  return `/soporte/incidencias/${encodeURIComponent(numeroCaso)}${ancla ? `#${ancla}` : ''}`;
}

// Para soporte: alguien con cuenta de reporte reportó una falla.
export function avisoReporteNuevo(numeroCaso: string, equipo: string, descripcion: string, quien: string): NuevoAviso {
  return {
    tipo: 'reporte_nuevo',
    titulo: `Nueva falla en ${equipo} (${numeroCaso})`,
    detalle: recortar(`${quien}: ${descripcion}`),
    enlace: enlaceCaso(numeroCaso),
  };
}

// Para quien reportó: un técnico tomó su caso.
export function avisoCasoAsignado(numeroCaso: string, equipo: string, tecnico: string): NuevoAviso {
  return {
    tipo: 'caso_asignado',
    titulo: `${numeroCaso} está en revisión`,
    detalle: `${tecnico} atiende la falla de ${equipo}.`,
    enlace: enlaceCaso(numeroCaso),
  };
}

export function avisoCasoReasignado(numeroCaso: string, equipo: string, tecnico: string): NuevoAviso {
  return {
    tipo: 'caso_reasignado',
    titulo: `${numeroCaso} pasó a otro técnico`,
    detalle: `Ahora ${tecnico} atiende la falla de ${equipo}.`,
    enlace: enlaceCaso(numeroCaso),
  };
}

export function avisoCasoCerrado(numeroCaso: string, equipo: string, nota: string | null): NuevoAviso {
  return {
    tipo: 'caso_cerrado',
    titulo: `${numeroCaso} se cerró`,
    detalle: nota ? recortar(`Solución: ${nota}`) : `La falla de ${equipo} quedó resuelta.`,
    enlace: enlaceCaso(numeroCaso, 'conversacion'),
  };
}

export function avisoComentario(numeroCaso: string, quien: string, texto: string): NuevoAviso {
  return {
    tipo: 'comentario',
    titulo: `Comentario nuevo en ${numeroCaso}`,
    detalle: recortar(`${quien}: ${texto}`),
    enlace: enlaceCaso(numeroCaso, 'conversacion'),
  };
}

// Para los administradores: una cuenta institucional pide el acceso de soporte.
export function avisoSolicitudSoporte(email: string): NuevoAviso {
  return {
    tipo: 'solicitud_soporte',
    titulo: 'Solicitud de acceso de soporte',
    detalle: `${email} pide entrar al equipo de soporte. Revise que sea una persona del equipo antes de aprobar.`,
    enlace: '/soporte/usuarios#solicitudes',
  };
}

export function avisoSolicitudAprobada(): NuevoAviso {
  return {
    tipo: 'solicitud_aprobada',
    titulo: 'Se aprobó su acceso de soporte',
    detalle: 'Ya puede gestionar salas, equipos, técnicos e incidencias.',
    enlace: '/soporte',
  };
}

export function avisoSolicitudRechazada(): NuevoAviso {
  return {
    tipo: 'solicitud_rechazada',
    titulo: 'Su solicitud de soporte no se aprobó',
    detalle: 'Su cuenta sigue sirviendo para reportar fallas. Si es un error, hable con el administrador.',
    enlace: '/soporte/cuenta',
  };
}
