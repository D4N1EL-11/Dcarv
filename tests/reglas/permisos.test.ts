// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  esSoporte,
  inicioPara,
  puedeUsarApi,
  puedeVerPagina,
  redireccionReporte,
  redireccionSinPermiso,
  rolParaCorreo,
} from '@/lib/auth/permisos';

describe('rol según el correo', () => {
  it('@usa.edu.co nace como soporte; los demás, como cuenta de reporte', () => {
    expect(rolParaCorreo('daniel@usa.edu.co')).toBe('editor');
    expect(rolParaCorreo('  Ana.Perez@USA.EDU.CO ')).toBe('editor');
    expect(rolParaCorreo('ana@gmail.com')).toBe('viewer');
    expect(rolParaCorreo('ana@hotmail.com')).toBe('viewer');
  });

  it('solo cuenta el dominio exacto', () => {
    expect(rolParaCorreo('x@usa.edu.co.falso.com')).toBe('viewer');
    expect(rolParaCorreo('x@estudiantes-usa.edu.co')).toBe('viewer');
    expect(rolParaCorreo('usa.edu.co@gmail.com')).toBe('viewer');
  });

  it('admin y editor son soporte; viewer no', () => {
    expect(esSoporte('admin')).toBe(true);
    expect(esSoporte('editor')).toBe(true);
    expect(esSoporte('viewer')).toBe(false);
    expect(esSoporte(null)).toBe(false);
    expect(inicioPara('viewer')).toBe('/soporte/reportar');
    expect(inicioPara('admin')).toBe('/soporte');
  });
});

describe('páginas', () => {
  it('soporte abre todo', () => {
    for (const ruta of ['/soporte', '/soporte/salas', '/soporte/alertas', '/soporte/equipos/PC-01']) {
      expect(puedeVerPagina('editor', ruta)).toBe(true);
    }
  });

  it('una cuenta de reporte solo abre reportar, sus reportes, ayuda y cuenta', () => {
    for (const ruta of ['/soporte/reportar', '/soporte/mis-reportes', '/soporte/ayuda', '/soporte/cuenta']) {
      expect(puedeVerPagina('viewer', ruta)).toBe(true);
    }
    for (const ruta of ['/soporte', '/soporte/salas', '/soporte/tecnicos', '/soporte/incidencias', '/soporte/alertas', '/soporte/equipos/nuevo', '/soporte/reportarX']) {
      expect(puedeVerPagina('viewer', ruta)).toBe(false);
    }
  });

  it('"Cuentas y roles" es solo de administradores; soporte sin permiso vuelve al panel', () => {
    expect(puedeVerPagina('admin', '/soporte/usuarios')).toBe(true);
    expect(puedeVerPagina('editor', '/soporte/usuarios')).toBe(false);
    expect(puedeVerPagina('viewer', '/soporte/usuarios')).toBe(false);
    expect(redireccionSinPermiso('editor', '/soporte/usuarios')).toBe('/soporte');
    expect(redireccionSinPermiso('viewer', '/soporte/usuarios')).toBe('/soporte/reportar');
  });

  it('la ficha de un equipo lleva al reporte de ese equipo', () => {
    expect(redireccionReporte('/soporte/equipos/PC-01')).toBe('/soporte/reportar?equipo=PC-01');
    expect(redireccionReporte('/soporte/equipos/nuevo')).toBe('/soporte/reportar');
    expect(redireccionReporte('/soporte/salas')).toBe('/soporte/reportar');
  });
});

describe('API', () => {
  it('una cuenta de reporte puede reportar y leer lo necesario para el formulario', () => {
    expect(puedeUsarApi('viewer', 'POST', '/api/soporte/equipos/PC-01/incidencias')).toBe(true);
    expect(puedeUsarApi('viewer', 'GET', '/api/soporte/salas')).toBe(true);
    expect(puedeUsarApi('viewer', 'GET', '/api/soporte/equipos')).toBe(true);
    expect(puedeUsarApi('viewer', 'post', '/api/soporte/incidencias/INC-0001/foto')).toBe(true);
  });

  it('una cuenta de reporte no cambia estados ni administra nada', () => {
    const prohibidas: [string, string][] = [
      ['PATCH', '/api/soporte/equipos/PC-01/estado'],
      ['PATCH', '/api/soporte/equipos/PC-01'],
      ['POST', '/api/soporte/equipos'],
      ['POST', '/api/soporte/salas'],
      ['PATCH', '/api/soporte/salas/1'],
      ['DELETE', '/api/soporte/salas/1'],
      ['POST', '/api/soporte/tecnicos'],
      ['GET', '/api/soporte/tecnicos'],
      ['POST', '/api/soporte/incidencias/INC-0001/cerrar'],
      ['POST', '/api/soporte/incidencias/INC-0001/asignar'],
      ['GET', '/api/soporte/incidencias'],
      ['GET', '/api/soporte/exportar/equipos'],
      ['GET', '/api/soporte/buscar'],
      ['GET', '/api/soporte/alertas'],
      ['GET', '/api/soporte/equipos/PC-01/incidencias'],
      ['DELETE', '/api/soporte/equipos/PC-01/incidencias'],
    ];
    for (const [metodo, ruta] of prohibidas) expect(puedeUsarApi('viewer', metodo, ruta), `${metodo} ${ruta}`).toBe(false);
  });

  it('soporte usa toda la API', () => {
    expect(puedeUsarApi('admin', 'DELETE', '/api/soporte/salas/1')).toBe(true);
    expect(puedeUsarApi('editor', 'PATCH', '/api/soporte/equipos/PC-01/estado')).toBe(true);
  });
});
