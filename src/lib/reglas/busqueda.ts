// Texto libre → consulta de búsqueda de Postgres en español (websearch_to_tsquery): las palabras
// significativas unidas con "or", para encontrar guías y casos que compartan alguna. Se quitan
// signos y palabras cortas o muy comunes que no ayudan a distinguir una falla de otra.

const VACIAS = new Set([
  'para', 'pero', 'como', 'cuando', 'esta', 'este', 'esto', 'tiene', 'hace', 'hacer', 'desde',
  'sale', 'favor', 'equipo', 'computador', 'computadora', 'sala', 'muy', 'todo', 'nada', 'sigue',
]);

export function terminosBusqueda(texto: string, maximo = 8): string[] {
  const palabras = texto
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((p) => p.length >= 4 && !VACIAS.has(p));
  return [...new Set(palabras)].slice(0, maximo);
}

// "" si no queda ninguna palabra útil: quien llama no busca.
export function consultaWebsearch(texto: string): string {
  return terminosBusqueda(texto).join(' or ');
}
