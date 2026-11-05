import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  actividadReciente,
  asignarTecnico,
  buscarGlobal,
  cambiarActividadTecnico,
  cerrarConexion,
  cerrarIncidencia,
  contarIncidenciasPorEstado,
  crearEquipo,
  crearSala,
  crearTecnico,
  eliminarSala,
  listarCandidatosABaja,
  listarSalas,
  obtenerEquipo,
  paginarEquipos,
  paginarIncidencias,
  renombrarSala,
  renombrarTecnico,
  reportarIncidencia,
  serieActividad,
  trasladarEquipo,
} from '@/lib/dataService';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';

// Prueba contra la base las mejoras de Panel, Incidencias, Salas, Técnicos y Alertas.
// Todo lo que crea empieza por "Prueba" / "PV-MEJ" y se borra antes y después.
let fallas = 0;

function limpiar() {
  execFileSync('node', ['scripts/limpiar-prueba.mjs', '--prueba'], { stdio: 'ignore' });
}

async function paso(nombre: string, comprobar: () => Promise<boolean>) {
  try {
    const bien = await comprobar();
    console.log(`${bien ? 'OK   ' : 'FALLA'} ${nombre}`);
    if (!bien) fallas += 1;
  } catch (error) {
    console.log(`FALLA ${nombre}: ${(error as Error).message}`);
    fallas += 1;
  }
}

async function falla(operacion: () => Promise<unknown>, codigo: CodigoError) {
  try {
    await operacion();
  } catch (error) {
    if (error instanceof ErrorDeNegocio) return error.codigo === codigo;
    throw error;
  }
  return false;
}

async function main() {
  limpiar();
  const sala = await crearSala('Prueba Mejoras');
  await crearSala('Prueba Otra');
  const vacia = await crearSala('Prueba Vacia');
  for (const n of ['01', '02', '03']) await crearEquipo({ codigo: `PV-MEJ-${n}`, salaId: sala.id });

  // Salas
  await paso('Renombrar sala', async () => {
    await renombrarSala(sala.id, '  Prueba Mejoras Renombrada  ');
    return (await listarSalas()).some((s) => s.id === sala.id && s.nombre === 'Prueba Mejoras Renombrada');
  });
  await paso('Renombrar a un nombre existente (otra grafía) → SALA_DUPLICADA', () =>
    falla(() => renombrarSala(sala.id, 'prueba otra'), 'SALA_DUPLICADA'),
  );
  await paso('Eliminar sala con equipos → TIENE_DEPENDENCIAS', () =>
    falla(() => eliminarSala(sala.id), 'TIENE_DEPENDENCIAS'),
  );
  await paso('Eliminar sala vacía', async () => {
    await eliminarSala(vacia.id);
    return !(await listarSalas()).some((s) => s.id === vacia.id);
  });
  await paso('Eliminar sala inexistente → SALA_NO_ENCONTRADA', () =>
    falla(() => eliminarSala(randomUUID()), 'SALA_NO_ENCONTRADA'),
  );

  // Panel: paginación y conteo de 30 días
  await paso('Paginar equipos: total y páginas', async () => {
    const primera = await paginarEquipos({ busqueda: 'PV-MEJ-' }, 1, 2);
    const segunda = await paginarEquipos({ busqueda: 'PV-MEJ-' }, 2, 2);
    return (
      primera.total === 3 &&
      primera.paginas === 2 &&
      primera.filas.length === 2 &&
      segunda.filas.length === 1 &&
      segunda.filas[0]?.codigo === 'PV-MEJ-03' &&
      !('totalFilas' in primera.filas[0]!)
    );
  });
  const caso1 = (await reportarIncidencia('PV-MEJ-01', 'Pantalla azul al iniciar')).incidencia;
  await paso('Incidencias de 30 días con la fecha de Bogotá', async () => {
    const { equipo } = await obtenerEquipo('PV-MEJ-01');
    return equipo.incidencias30d === 1 && caso1.fecha === hoyBogota();
  });

  // Incidencias: búsqueda, conteos con filtros, cierre
  await paso('Buscar por texto de la falla (sin distinguir mayúsculas)', async () => {
    const { filas, total } = await paginarIncidencias({ busqueda: 'PANTALLA AZUL' }, 1, 25);
    return total >= 1 && filas.some((i) => i.numeroCaso === caso1.numeroCaso);
  });
  await paso('Buscar con comodines de SQL no los interpreta', async () => {
    const { total } = await paginarIncidencias({ busqueda: '%_%', equipoCodigo: 'PV-MEJ-01' }, 1, 25);
    return total === 0;
  });
  await paso('Conteo por estado respeta el filtro de equipo', async () => {
    const conteo = await contarIncidenciasPorEstado({ equipoCodigo: 'PV-MEJ-01' });
    return conteo.abierta === 1 && conteo.en_revision === 0 && conteo.cerrada === 0;
  });
  await paso('Fila de incidencia trae estado del equipo y otras pendientes', async () => {
    const { filas } = await paginarIncidencias({ equipoCodigo: 'PV-MEJ-01' }, 1, 25);
    const fila = filas[0];
    return fila?.estadoEquipo === 'en_reparacion' && fila.otrasPendientes === 0 && fila.diaEstado === hoyBogota();
  });
  await paso('Cerrar la última pendiente con equipoFuncional reactiva el equipo', async () => {
    const r = await cerrarIncidencia(caso1.numeroCaso, { equipoFuncional: true });
    return r.equipoReactivado && (await obtenerEquipo('PV-MEJ-01')).equipo.estado === 'funcional';
  });
  const a = (await reportarIncidencia('PV-MEJ-02', 'No enciende')).incidencia;
  const b = (await reportarIncidencia('PV-MEJ-02', 'Teclado roto')).incidencia;
  await paso('Con otra pendiente, cerrar no reactiva el equipo', async () => {
    const r = await cerrarIncidencia(a.numeroCaso, { equipoFuncional: true });
    return !r.equipoReactivado && (await obtenerEquipo('PV-MEJ-02')).equipo.estado === 'en_reparacion';
  });
  await paso('Cerrar sin la opción deja el equipo como estaba', async () => {
    const r = await cerrarIncidencia(b.numeroCaso);
    return !r.equipoReactivado && (await obtenerEquipo('PV-MEJ-02')).equipo.estado === 'en_reparacion';
  });
  await paso('Cerrar una inexistente → INCIDENCIA_NO_ENCONTRADA', () =>
    falla(() => cerrarIncidencia('INC-NO-EXISTE'), 'INCIDENCIA_NO_ENCONTRADA'),
  );

  // Técnicos
  const ana = await crearTecnico('Prueba Tecnico Mejoras A');
  await crearTecnico('Prueba Tecnico Mejoras B');
  await paso('Nombre de técnico inválido se rechaza en el servicio', () =>
    falla(() => crearTecnico(' a '), 'DATOS_INVALIDOS'),
  );
  await paso('Renombrar técnico a un nombre existente → TECNICO_DUPLICADO', () =>
    falla(() => renombrarTecnico(ana.id, 'prueba tecnico mejoras b'), 'TECNICO_DUPLICADO'),
  );
  const c1 = (await reportarIncidencia('PV-MEJ-03', 'Sin red')).incidencia;
  const c2 = (await reportarIncidencia('PV-MEJ-03', 'Mouse')).incidencia;
  await asignarTecnico(c1.numeroCaso, ana.id);
  await asignarTecnico(c2.numeroCaso, ana.id);
  await paso('Filtrar incidencias por técnico', async () => {
    const { total } = await paginarIncidencias({ tecnicoId: ana.id }, 1, 25);
    return total === 2;
  });
  await paso('Desactivar técnico reparte sus casos en revisión', async () => {
    const r = await cambiarActividadTecnico(ana.id, false);
    const { total } = await paginarIncidencias({ tecnicoId: ana.id, estado: 'en_revision' }, 1, 25);
    return !r.activo && r.reasignadas === 2 && r.sinReasignar === 0 && total === 0;
  });
  await paso('Un técnico inactivo no recibe asignaciones', async () => {
    const c3 = (await reportarIncidencia('PV-MEJ-03', 'Monitor')).incidencia;
    return falla(() => asignarTecnico(c3.numeroCaso, ana.id), 'TECNICO_NO_ENCONTRADO');
  });
  await paso('Reactivar técnico', async () => (await cambiarActividadTecnico(ana.id, true)).activo);
  await paso('Técnico inexistente → TECNICO_NO_ENCONTRADO', () =>
    falla(() => cambiarActividadTecnico(randomUUID(), false), 'TECNICO_NO_ENCONTRADO'),
  );

  // Panel: serie de 30 días y movimientos recientes
  await paso('Serie de actividad: 31 días y las de hoy contadas', async () => {
    const serie = await serieActividad();
    const hoy = serie.at(-1);
    return serie.length === 31 && hoy?.dia === hoyBogota() && hoy.reportadas >= 6 && hoy.cerradas >= 3;
  });
  await paso('Movimientos recientes: lo último primero, con momento ISO', async () => {
    const eventos = await actividadReciente(20);
    const ordenados = eventos.every((e, i) => i === 0 || eventos[i - 1]!.momento >= e.momento);
    const propios = eventos.filter((e) => e.equipoCodigo.startsWith('PV-MEJ-'));
    return (
      ordenados &&
      propios.some((e) => e.tipo === 'cerrada') &&
      propios.some((e) => e.tipo === 'en_revision') &&
      eventos.every((e) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(e.momento))
    );
  });

  // Búsqueda global
  await paso('Búsqueda global encuentra equipos, casos, salas y técnicos', async () => {
    const r = await buscarGlobal('mej');
    return (
      r.equipos.some((e) => e.codigo === 'PV-MEJ-01') &&
      r.salas.some((s) => s.id === sala.id) &&
      r.tecnicos.some((t) => t.nombre === 'Prueba Tecnico Mejoras A') &&
      (await buscarGlobal(c1.numeroCaso)).incidencias[0]?.numeroCaso === c1.numeroCaso
    );
  });
  await paso('Búsqueda global no interpreta comodines', async () => {
    const r = await buscarGlobal('%%');
    return !r.equipos.some((e) => e.codigo.startsWith('PV-MEJ-'));
  });

  // Ficha: trasladar de sala
  const otra = (await listarSalas()).find((s) => s.nombre === 'Prueba Otra')!;
  await paso('Trasladar equipo a otra sala conserva su historial', async () => {
    const { sala: nombre } = await trasladarEquipo('PV-MEJ-03', otra.id);
    const { equipo, historial } = await obtenerEquipo('PV-MEJ-03');
    return nombre === 'Prueba Otra' && equipo.salaId === otra.id && historial.length === 3;
  });
  await paso('Trasladar a una sala inexistente → SALA_NO_ENCONTRADA', () =>
    falla(() => trasladarEquipo('PV-MEJ-03', randomUUID()), 'SALA_NO_ENCONTRADA'),
  );
  await trasladarEquipo('PV-MEJ-03', sala.id);

  // Alertas: PV-MEJ-03 tiene 3 incidencias hoy.
  await paso('Alerta con conteo, último reporte y pendientes', async () => {
    const candidato = (await listarCandidatosABaja()).find((c) => c.codigo === 'PV-MEJ-03');
    return (
      candidato?.incidencias30d === 3 &&
      candidato.ultimaFecha === hoyBogota() &&
      candidato.pendientes === 3 &&
      candidato.sala === 'Prueba Mejoras Renombrada'
    );
  });
  await paso('Dos incidencias no generan alerta', async () =>
    !(await listarCandidatosABaja()).some((c) => c.codigo === 'PV-MEJ-02'),
  );
}

main()
  .catch((error) => {
    console.error(error);
    fallas += 1;
  })
  .finally(async () => {
    limpiar();
    await cerrarConexion();
    console.log(`\nFallas: ${fallas}`);
    process.exitCode = fallas ? 1 : 0;
  });
