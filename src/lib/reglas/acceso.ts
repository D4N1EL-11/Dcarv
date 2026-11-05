// Freno a la prueba de contraseñas: tras MAXIMO_INTENTOS_FALLIDOS fallos seguidos con el mismo
// correo, el login espera MINUTOS_BLOQUEO desde el último fallo. Un acceso correcto reinicia la
// cuenta. Regla pura: recibe los intentos y la hora.

export const MAXIMO_INTENTOS_FALLIDOS = 5;
export const MINUTOS_BLOQUEO = 15;

export type Intento = { exito: boolean; momento: string };

export type EstadoBloqueo = { bloqueado: boolean; minutosRestantes: number; intentosRestantes: number };

// intentos: del más reciente al más antiguo.
export function evaluarBloqueo(intentos: Intento[], ahora: Date): EstadoBloqueo {
  const ventana = MINUTOS_BLOQUEO * 60_000;
  let fallos = 0;
  let ultimoFallo: number | null = null;
  for (const intento of intentos) {
    const momento = Date.parse(intento.momento);
    if (Number.isNaN(momento) || ahora.getTime() - momento > ventana) break;
    if (intento.exito) break;
    fallos += 1;
    ultimoFallo ??= momento;
  }
  if (fallos >= MAXIMO_INTENTOS_FALLIDOS && ultimoFallo !== null) {
    const restante = ultimoFallo + ventana - ahora.getTime();
    return { bloqueado: true, minutosRestantes: Math.max(1, Math.ceil(restante / 60_000)), intentosRestantes: 0 };
  }
  return { bloqueado: false, minutosRestantes: 0, intentosRestantes: MAXIMO_INTENTOS_FALLIDOS - fallos };
}
