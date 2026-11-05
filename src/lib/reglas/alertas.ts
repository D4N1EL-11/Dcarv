import { INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';

export function esCandidatoABaja(incidenciasEnVentana: number): boolean {
  return incidenciasEnVentana >= INCIDENCIAS_PARA_ALERTA;
}

// Aviso temprano (no cambia RN-09): al equipo le falta una sola falla en la ventana para ser
// candidato a baja. Sirve para revisarlo antes de que llegue al umbral.
export function estaEnObservacion(incidenciasEnVentana: number): boolean {
  return incidenciasEnVentana === INCIDENCIAS_PARA_ALERTA - 1 && INCIDENCIAS_PARA_ALERTA > 1;
}
