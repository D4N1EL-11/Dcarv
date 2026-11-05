// CSV para Excel en español: separador ";" (la coma es el separador decimal en es-CO),
// BOM UTF-8 para que las tildes se lean bien y fin de línea CRLF.
const SEPARADOR = ';';
export const BOM = String.fromCharCode(0xfeff);

// Una celda que empieza por = + - @ (o tabulador/retorno) se prefija con ' para que la hoja de
// cálculo no la ejecute como fórmula (inyección de CSV): las descripciones las escribe el usuario.
export function celdaCsv(valor: unknown): string {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  const necesitaComillas = /[";\r\n]/.test(texto) || texto !== texto.trim();
  return necesitaComillas ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function aCsv(encabezados: string[], filas: unknown[][]): string {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celdaCsv).join(SEPARADOR));
  return `${BOM}${lineas.join('\r\n')}\r\n`;
}
