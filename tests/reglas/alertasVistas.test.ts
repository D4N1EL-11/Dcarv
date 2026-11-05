import { describe, expect, it } from 'vitest';
import { contarSinVer, leerVistos, serializarVistos } from '@/lib/alertasVistas';

describe('alertas vistas', () => {
  it('ida y vuelta: lo que se guarda se lee igual (codificado o decodificado)', () => {
    const valor = serializarVistos(['PC-01', 'SALA 2, PC;03', 'PC-01']);
    expect([...leerVistos(valor)]).toEqual(['PC-01', 'SALA 2, PC;03']);
    expect([...leerVistos(decodeURIComponent(valor))]).toEqual(['PC-01', 'SALA 2, PC;03']);
  });
  it('valores vacíos, dañados o con otra forma equivalen a nada visto', () => {
    for (const malo of [undefined, null, '', 'basura', '%E0%A4%A', '{"a":1}', '[1,2]']) {
      expect(leerVistos(malo).size).toBe(0);
    }
  });
  it('cuenta solo los candidatos que no se han visto', () => {
    const vistos = new Set(['PC-01', 'PC-02']);
    expect(contarSinVer(['PC-01', 'PC-02'], vistos)).toBe(0);
    expect(contarSinVer(['PC-01', 'PC-03'], vistos)).toBe(1);
    expect(contarSinVer(['PC-04', 'PC-05'], new Set())).toBe(2);
  });
  it('un equipo dado de baja sale de los candidatos y deja de contar', () => {
    // Antes: 2 candidatos sin ver. Se da de baja PC-01: la consulta ya no lo devuelve.
    expect(contarSinVer(['PC-01', 'PC-02'], new Set())).toBe(2);
    expect(contarSinVer(['PC-02'], new Set())).toBe(1);
  });
  it('limita la cantidad guardada para no pasar el tamaño de una cookie', () => {
    const muchos = Array.from({ length: 200 }, (_, i) => `EQUIPO-CON-CODIGO-LARGO-${String(i).padStart(4, '0')}`);
    const valor = serializarVistos(muchos);
    expect(leerVistos(valor).size).toBe(60);
    expect(valor.length).toBeLessThan(4000);
  });
});
