import { ESTADOS_EQUIPO, MAXIMO_LOTE_EQUIPOS } from '@/lib/config/soporte';
import { ErrorDeNegocio } from './errores';

export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number];

export const ETIQUETA_EQUIPO: Record<EstadoEquipo, string> = {
  funcional: 'Funcional',
  en_reparacion: 'En reparación',
  dado_de_baja: 'Dado de baja',
};

// Recorta y conserva la grafía: el plan (10.5) respeta mayúsculas.
export function normalizarCodigo(codigo: string): string {
  return codigo.trim();
}

export function esEstadoEquipoValido(estado: string): estado is EstadoEquipo {
  return (ESTADOS_EQUIPO as readonly string[]).includes(estado);
}

export function validarDatosEquipo(d: { codigo: string; sala: string }): void {
  if (!d.codigo.trim() || !d.sala.trim()) throw new ErrorDeNegocio('DATOS_INVALIDOS');
}

// Inventario de una sala de una vez: ('PC-SALA1-', 1, 3, 2) → PC-SALA1-01, PC-SALA1-02, PC-SALA1-03.
export function generarCodigos(
  prefijo: string,
  desde: number,
  hasta: number,
  digitos: number,
): string[] {
  const base = normalizarCodigo(prefijo);
  const enteros = [desde, hasta, digitos].every(Number.isInteger);
  if (!base || !enteros || desde < 0 || hasta < desde || digitos < 1 || digitos > 4) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Revise el prefijo y el rango de números.');
  }
  if (hasta - desde + 1 > MAXIMO_LOTE_EQUIPOS) {
    throw new ErrorDeNegocio(
      'DATOS_INVALIDOS',
      `Se pueden registrar hasta ${MAXIMO_LOTE_EQUIPOS} equipos a la vez.`,
    );
  }
  const codigos: string[] = [];
  for (let n = desde; n <= hasta; n += 1) codigos.push(base + String(n).padStart(digitos, '0'));
  if (codigos.some((codigo) => codigo.length > 40)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Los códigos no pueden pasar de 40 caracteres.');
  }
  return codigos;
}
