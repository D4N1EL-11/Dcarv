import { MINUTOS_BLOQUEO, type Intento } from '@/lib/reglas/acceso';
import { consultar } from '@/lib/db/conexion';

const ISO = `'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'`;

// Intentos de inicio de sesión de un correo dentro de la ventana de bloqueo, del más reciente
// al más antiguo (lib/reglas/acceso.ts decide si hay que esperar). "ahora" es la hora de la base,
// la misma que guardó cada intento: con el reloj del servidor web, una diferencia de segundos
// entre ambos relojes cambiaba la espera calculada.
export async function intentosRecientes(email: string): Promise<{ intentos: Intento[]; ahora: Date }> {
  const filas = await consultar<Intento & { ahora: string }>(
    `SELECT exito, to_char(momento AT TIME ZONE 'UTC', ${ISO}) AS momento,
            to_char(now() AT TIME ZONE 'UTC', ${ISO}) AS ahora
       FROM intentos_acceso
      WHERE email = $1 AND momento > now() - make_interval(mins => $2)
      ORDER BY momento DESC
      LIMIT 20`,
    [email.trim().toLowerCase(), MINUTOS_BLOQUEO],
  );
  return {
    intentos: filas.map(({ exito, momento }) => ({ exito, momento })),
    ahora: filas[0] ? new Date(filas[0].ahora) : new Date(),
  };
}

// Guarda el intento y borra los de ese correo con más de un día: la tabla no crece sin fin.
export async function registrarIntento(email: string, exito: boolean): Promise<void> {
  const correo = email.trim().toLowerCase();
  await consultar('INSERT INTO intentos_acceso (email, exito) VALUES ($1, $2)', [correo, exito]);
  await consultar(`DELETE FROM intentos_acceso WHERE email = $1 AND momento < now() - interval '1 day'`, [correo]);
}
