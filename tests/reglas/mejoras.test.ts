import { describe, expect, it } from 'vitest';
import { rutaSegura } from '@/lib/auth/redireccion';
import { dentroDeVentana, inicioVentana, sumarDias } from '@/lib/reglas/fechas';
import { puedeReactivarseAlCerrar } from '@/lib/reglas/incidencia';
import {
  desplazamiento,
  normalizarPagina,
  rangoVisible,
  totalPaginas,
} from '@/lib/reglas/paginacion';
import { validarNombreSala } from '@/lib/reglas/sala';
import {
  diasHastaReasignacion,
  elegirConMenosCarga,
  validarNombreTecnico,
} from '@/lib/reglas/tecnico';
import { esperarCodigo } from './ayudas';

const hoy = '2026-06-15';

describe('ventana de 30 días como fecha de inicio', () => {
  it('sumarDias cruza meses y años', () => {
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('inicioVentana es el primer día que dentroDeVentana acepta', () => {
    const inicio = inicioVentana(hoy, 30);
    expect(inicio).toBe('2026-05-16');
    expect(dentroDeVentana(inicio, hoy, 30)).toBe(true);
    expect(dentroDeVentana(sumarDias(inicio, -1), hoy, 30)).toBe(false);
  });
});

describe('paginación', () => {
  it('normalizarPagina acepta enteros positivos y descarta lo demás', () => {
    expect(normalizarPagina('3')).toBe(3);
    expect(normalizarPagina(['2', '9'])).toBe(2);
    for (const raro of [undefined, '', '0', '-1', '2.5', 'abc', null, {}]) {
      expect(normalizarPagina(raro)).toBe(1);
    }
    expect(normalizarPagina('999999999')).toBe(100_000);
  });
  it('totalPaginas nunca es menor que 1', () => {
    expect(totalPaginas(0, 25)).toBe(1);
    expect(totalPaginas(25, 25)).toBe(1);
    expect(totalPaginas(26, 25)).toBe(2);
  });
  it('desplazamiento y rango visible', () => {
    expect(desplazamiento(1, 25)).toBe(0);
    expect(desplazamiento(3, 25)).toBe(50);
    expect(rangoVisible(1, 25, 60)).toEqual({ desde: 1, hasta: 25 });
    expect(rangoVisible(3, 25, 60)).toEqual({ desde: 51, hasta: 60 });
    expect(rangoVisible(1, 25, 0)).toEqual({ desde: 0, hasta: 0 });
  });
});

describe('reparto de casos entre técnicos (RN-10)', () => {
  const carga = new Map([
    ['ana', 2],
    ['beto', 0],
    ['carla', 0],
  ]);
  it('elige al de menos carga y, en empate, al primero del orden', () => {
    expect(elegirConMenosCarga(carga, null)).toBe('beto');
  });
  it('nunca devuelve al técnico actual', () => {
    expect(elegirConMenosCarga(carga, 'beto')).toBe('carla');
    expect(elegirConMenosCarga(new Map([['ana', 0]]), 'ana')).toBeNull();
  });
  it('sin técnicos activos no hay a quién asignar', () => {
    expect(elegirConMenosCarga(new Map(), null)).toBeNull();
  });
  it('diasHastaReasignacion: se reasigna al pasar más de 5 días', () => {
    expect(diasHastaReasignacion(0)).toBe(6);
    expect(diasHastaReasignacion(5)).toBe(1);
    expect(diasHastaReasignacion(6)).toBe(0);
    expect(diasHastaReasignacion(40)).toBe(0);
  });
});

describe('cerrar una incidencia y reactivar el equipo', () => {
  it('solo si estaba en reparación y no le quedan otras pendientes', () => {
    expect(puedeReactivarseAlCerrar('en_reparacion', 0)).toBe(true);
    expect(puedeReactivarseAlCerrar('en_reparacion', 1)).toBe(false);
    expect(puedeReactivarseAlCerrar('funcional', 0)).toBe(false);
    expect(puedeReactivarseAlCerrar('dado_de_baja', 0)).toBe(false);
  });
});

describe('validación de nombres en el servicio', () => {
  it('sala: no vacía y hasta 80 caracteres', () => {
    expect(() => validarNombreSala('Sala 1')).not.toThrow();
    esperarCodigo(() => validarNombreSala('   '), 'DATOS_INVALIDOS');
    esperarCodigo(() => validarNombreSala('x'.repeat(81)), 'DATOS_INVALIDOS');
  });
  it('técnico: entre 2 y 100 caracteres', () => {
    expect(() => validarNombreTecnico('Ana')).not.toThrow();
    esperarCodigo(() => validarNombreTecnico(' a '), 'DATOS_INVALIDOS');
    esperarCodigo(() => validarNombreTecnico('x'.repeat(101)), 'DATOS_INVALIDOS');
  });
});

describe('destino después de iniciar sesión', () => {
  it('acepta rutas internas del módulo', () => {
    expect(rutaSegura('/soporte')).toBe('/soporte');
    expect(rutaSegura('/soporte/incidencias?estado=abierta')).toBe('/soporte/incidencias?estado=abierta');
  });
  it('rechaza redirecciones abiertas y rutas ajenas', () => {
    for (const malo of [null, '', 'https://malo.com', '//malo.com', '/\\malo.com', '/soportex', '/login', '/soporte\\..\\x']) {
      expect(rutaSegura(malo)).toBe('/soporte');
    }
  });
});
