// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  avisoCasoAsignado,
  avisoCasoCerrado,
  avisoComentario,
  avisoReporteNuevo,
  avisoSolicitudAprobada,
  avisoSolicitudSoporte,
  enlaceCaso,
  recortar,
} from '@/lib/reglas/avisos';

describe('avisos de la campana', () => {
  it('todo enlace queda dentro del módulo (la base también lo exige)', () => {
    const avisos = [
      avisoReporteNuevo('INC-0007', 'PC-01', 'No enciende', 'ana@gmail.com'),
      avisoCasoAsignado('INC-0007', 'PC-01', 'Laura'),
      avisoCasoCerrado('INC-0007', 'PC-01', null),
      avisoComentario('INC-0007', 'Soporte', 'Falta el repuesto'),
      avisoSolicitudSoporte('nuevo@usa.edu.co'),
      avisoSolicitudAprobada(),
    ];
    for (const aviso of avisos) expect(aviso.enlace.startsWith('/soporte')).toBe(true);
  });

  it('el enlace de un caso lleva a su ficha (y a la conversación cuando hay un comentario)', () => {
    expect(enlaceCaso('INC-0007')).toBe('/soporte/incidencias/INC-0007');
    expect(avisoComentario('INC-0007', 'Soporte', 'Hola').enlace).toBe('/soporte/incidencias/INC-0007#conversacion');
  });

  it('el cierre muestra la solución si la hay', () => {
    expect(avisoCasoCerrado('INC-0007', 'PC-01', 'Se cambió la fuente').detalle).toBe('Solución: Se cambió la fuente');
    expect(avisoCasoCerrado('INC-0007', 'PC-01', null).detalle).toMatch(/PC-01/);
  });

  it('recorta textos largos y une los espacios', () => {
    expect(recortar('  uno   dos\n tres ')).toBe('uno dos tres');
    const largo = recortar('a'.repeat(300));
    expect(largo.length).toBeLessThanOrEqual(160);
    expect(largo.endsWith('…')).toBe(true);
  });
});
