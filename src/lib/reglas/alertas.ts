import { INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';

export function esCandidatoABaja(incidenciasEnVentana: number): boolean {
  return incidenciasEnVentana >= INCIDENCIAS_PARA_ALERTA;
}
