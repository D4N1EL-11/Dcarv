import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  cambiarEstadoEquipo,
  cerrarConexion,
  cerrarIncidencia,
  crearEquipo,
  crearSala,
  historialDeEquipo,
  listarIncidencias,
  obtenerEquipo,
  reportarIncidencia,
} from '@/lib/dataService';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';

const CODIGO = 'PV-TEST-01';
let fallas = 0;

function limpiar() {
  execFileSync('node', ['scripts/limpiar-prueba.mjs', '--prueba'], { stdio: 'ignore' });
}

async function paso(numero: number, nombre: string, comprobar: () => Promise<boolean>) {
  try {
    if (await comprobar()) {
      console.log(`OK    ${numero}. ${nombre}`);
      return;
    }
    console.log(`FALLA ${numero}. ${nombre}`);
  } catch (error) {
    console.log(`FALLA ${numero}. ${nombre}: ${(error as Error).message}`);
  }
  fallas += 1;
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

async function estadoActual() {
  return (await obtenerEquipo(CODIGO)).equipo.estado;
}

async function main() {
  limpiar();
  let salaId = '';
  let primera = '';
  let segunda = '';

  await paso(1, 'Crear sala', async () => {
    salaId = (await crearSala('Prueba Sala 1')).id;
    return Boolean(salaId);
  });
  await paso(2, 'Sala repetida con otra grafía', () =>
    falla(() => crearSala('prueba sala 1'), 'SALA_DUPLICADA'),
  );
  await paso(3, 'Crear equipo funcional', async () => {
    await crearEquipo({ codigo: CODIGO, salaId });
    return (await estadoActual()) === 'funcional';
  });
  await paso(4, 'Código repetido', () =>
    falla(() => crearEquipo({ codigo: CODIGO, salaId }), 'CODIGO_DUPLICADO'),
  );
  await paso(5, 'Sala inexistente', () =>
    falla(() => crearEquipo({ codigo: 'PV-TEST-02', salaId: randomUUID() }), 'SALA_NO_ENCONTRADA'),
  );
  await paso(6, 'Reportar pone el equipo en reparación', async () => {
    const { incidencia, estadoEquipo } = await reportarIncidencia(CODIGO, 'No enciende');
    primera = incidencia.numeroCaso;
    return (
      /^INC-\d{4,}$/.test(primera) &&
      incidencia.estado === 'abierta' &&
      estadoEquipo === 'en_reparacion' &&
      (await estadoActual()) === 'en_reparacion'
    );
  });
  await paso(7, 'Segunda incidencia permitida', async () => {
    segunda = (await reportarIncidencia(CODIGO, 'Sin internet')).incidencia.numeroCaso;
    return (await historialDeEquipo(CODIGO)).length === 2;
  });
  await paso(8, 'Descripción vacía', () =>
    falla(() => reportarIncidencia(CODIGO, ''), 'DATOS_INVALIDOS'),
  );
  await paso(9, 'Equipo inexistente', () =>
    falla(() => reportarIncidencia('PV-TEST-99', 'No enciende'), 'EQUIPO_NO_ENCONTRADO'),
  );
  await paso(10, 'Cambiar a funcional sin secuencia', async () => {
    await cambiarEstadoEquipo(CODIGO, 'funcional');
    return (await estadoActual()) === 'funcional';
  });
  await paso(11, 'Estado inválido', () =>
    falla(() => cambiarEstadoEquipo(CODIGO, 'roto'), 'ESTADO_INVALIDO'),
  );
  await paso(12, 'Historial con la más reciente primero', async () => {
    const historial = await historialDeEquipo(CODIGO);
    return (
      historial.length === 2 &&
      historial[0]?.numeroCaso === segunda &&
      historial[1]?.numeroCaso === primera
    );
  });
  await paso(13, 'Equipo dado de baja sigue dado de baja al reportar', async () => {
    await cambiarEstadoEquipo(CODIGO, 'dado_de_baja');
    const { estadoEquipo } = await reportarIncidencia(CODIGO, 'Pantalla rota');
    return (
      estadoEquipo === 'dado_de_baja' &&
      (await estadoActual()) === 'dado_de_baja' &&
      (await historialDeEquipo(CODIGO)).length === 3
    );
  });
  await paso(14, 'Cerrar la primera incidencia', async () => {
    await cerrarIncidencia(primera);
    const filas = await listarIncidencias({ equipoCodigo: CODIGO, estado: 'cerrada' });
    return filas.length === 1 && filas[0]?.numeroCaso === primera;
  });
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
