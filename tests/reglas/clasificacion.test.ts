// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CATEGORIAS_INCIDENCIA, PRIORIDADES_INCIDENCIA } from '@/lib/config/soporte';
import {
  AYUDA_CATEGORIA,
  categoriaMasFrecuente,
  compararAtencion,
  esCategoria,
  esPrioridad,
  ETIQUETA_CATEGORIA,
  ETIQUETA_PRIORIDAD,
  pesoPrioridad,
} from '@/lib/reglas/clasificacion';

describe('categoría y prioridad', () => {
  it('cada valor tiene su etiqueta y su ayuda', () => {
    for (const c of CATEGORIAS_INCIDENCIA) {
      expect(ETIQUETA_CATEGORIA[c]).toBeTruthy();
      expect(AYUDA_CATEGORIA[c]).toBeTruthy();
    }
    for (const p of PRIORIDADES_INCIDENCIA) expect(ETIQUETA_PRIORIDAD[p]).toBeTruthy();
  });

  it('reconoce solo los valores válidos', () => {
    expect(esCategoria('hardware')).toBe(true);
    expect(esCategoria('HARDWARE')).toBe(false);
    expect(esCategoria('impresora')).toBe(false);
    expect(esPrioridad('alta')).toBe(true);
    expect(esPrioridad('urgente')).toBe(false);
    expect(esPrioridad(undefined)).toBe(false);
  });

  it('la prioridad alta se atiende primero; dentro de cada prioridad, lo más antiguo', () => {
    expect(pesoPrioridad('alta')).toBeLessThan(pesoPrioridad('media'));
    expect(pesoPrioridad('media')).toBeLessThan(pesoPrioridad('baja'));
    const casos = [
      { id: 'a', prioridad: 'media' as const, fecha: '2026-11-01' },
      { id: 'b', prioridad: 'alta' as const, fecha: '2026-11-05' },
      { id: 'c', prioridad: 'baja' as const, fecha: '2026-10-01' },
      { id: 'd', prioridad: 'alta' as const, fecha: '2026-11-02' },
    ];
    expect([...casos].sort(compararAtencion).map((c) => c.id)).toEqual(['d', 'b', 'a', 'c']);
  });

  it('la categoría más frecuente de una sala; sin casos, ninguna', () => {
    expect(categoriaMasFrecuente({ software: 2, hardware: 5, red: 1 })).toEqual({ categoria: 'hardware', total: 5 });
    // Empate: gana la que va primero en la lista de categorías.
    expect(categoriaMasFrecuente({ red: 3, hardware: 3 })).toEqual({ categoria: 'hardware', total: 3 });
    expect(categoriaMasFrecuente({})).toBeNull();
    expect(categoriaMasFrecuente({ otro: 0 })).toBeNull();
  });
});
