import { execFileSync } from 'node:child_process';
import {
  cerrarConexion,
  crearEquipo,
  crearSala,
  listarEquipos,
  reportarIncidencia,
} from '@/lib/dataService';

async function main() {
  execFileSync('node', ['scripts/limpiar-prueba.mjs', '--demo'], { stdio: 'inherit' });

  const salaA = await crearSala('Demo Sala A');
  const salaB = await crearSala('Demo Sala B');
  for (const numero of ['01', '02', '03']) {
    await crearEquipo({ codigo: `DEMO-A-${numero}`, salaId: salaA.id });
    await crearEquipo({ codigo: `DEMO-B-${numero}`, salaId: salaB.id });
  }

  // DEMO-A-01 acumula 3 incidencias: es candidato a baja (RN-09).
  await reportarIncidencia('DEMO-A-01', 'No enciende');
  await reportarIncidencia('DEMO-A-01', 'Se apaga solo');
  await reportarIncidencia('DEMO-A-01', 'Pantalla con líneas');
  await reportarIncidencia('DEMO-B-02', 'Sin conexión a internet');

  console.table(await listarEquipos({ busqueda: 'DEMO-' }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cerrarConexion);
