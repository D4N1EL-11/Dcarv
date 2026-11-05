// Evaluación de contraseñas para los formularios (registro, restablecimiento y cambio).
// Regla pura: no toca red ni base. El servidor solo exige la longitud mínima; lo demás es consejo.

export const LONGITUD_MINIMA_CONTRASENA = 8;

export type NivelContrasena = 0 | 1 | 2 | 3 | 4;

export type EvaluacionContrasena = {
  nivel: NivelContrasena;
  etiqueta: string;
  // Lo que el servidor acepta: solo la longitud mínima.
  valida: boolean;
  requisitos: { texto: string; cumple: boolean }[];
  consejo: string | null;
};

const ETIQUETAS: Record<NivelContrasena, string> = {
  0: 'Muy corta',
  1: 'Débil',
  2: 'Aceptable',
  3: 'Buena',
  4: 'Fuerte',
};

// Las más usadas en filtraciones (y sus variantes en español): se rechazan como débiles.
const COMUNES = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', 'password', 'password1',
  'contraseña', 'contrasena', 'qwertyui', 'qwerty123', 'abcdefgh', 'abc12345', 'iloveyou', 'admin123',
  'colombia', 'teamo123', 'micontraseña', 'soporte1',
]);

export function evaluarContrasena(clave: string, email = ''): EvaluacionContrasena {
  const largo = [...clave].length;
  const letrasYNumeros = /\p{L}/u.test(clave) && /\d/.test(clave);
  const mayusYMinus = /\p{Lu}/u.test(clave) && /\p{Ll}/u.test(clave);
  const simboloOLarga = /[^\p{L}\d]/u.test(clave) || largo >= 12;

  const requisitos = [
    { texto: `Al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres`, cumple: largo >= LONGITUD_MINIMA_CONTRASENA },
    { texto: 'Letras y números', cumple: letrasYNumeros },
    { texto: 'Mayúsculas y minúsculas', cumple: mayusYMinus },
    { texto: 'Un símbolo o 12 caracteres', cumple: simboloOLarga },
  ];

  const valida = largo >= LONGITUD_MINIMA_CONTRASENA;
  if (!valida) return { nivel: 0, etiqueta: ETIQUETAS[0], valida, requisitos, consejo: null };

  const minuscula = clave.toLowerCase();
  const usuario = email.split('@')[0]?.toLowerCase() ?? '';
  const repetida = /^(.)\1+$/.test(clave);
  if (COMUNES.has(minuscula) || repetida) {
    return { nivel: 1, etiqueta: ETIQUETAS[1], valida, requisitos, consejo: 'Es una contraseña muy común: cualquiera la adivina.' };
  }
  if (usuario.length >= 4 && minuscula.includes(usuario)) {
    return { nivel: 1, etiqueta: ETIQUETAS[1], valida, requisitos, consejo: 'No uses tu correo dentro de la contraseña.' };
  }

  const nivel = (1 + [letrasYNumeros, mayusYMinus, simboloOLarga].filter(Boolean).length) as NivelContrasena;
  return { nivel, etiqueta: ETIQUETAS[nivel], valida, requisitos, consejo: null };
}
