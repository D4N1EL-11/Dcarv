import { execFileSync } from 'node:child_process';
import pg from 'pg';
import {
  asignarTecnico,
  cerrarConexion,
  crearEquipo,
  crearSala,
  crearTecnico,
  listarCandidatosABaja,
  listarIncidencias,
  reasignarIncidenciasVencidas,
  reportarIncidencia,
} from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const CODIGO = 'PV-TEST-OPC';
let fallas = 0;

function limpiar() {
  execFileSync('node', ['scripts/limpiar-prueba.mjs', '--prueba'], { stdio: 'ignore' });
}

function comprobar(nombre: string, resultado: boolean) {
  console.log(`${resultado ? 'OK   ' : 'FALLA'} ${nombre}`);
  if (!resultado) fallas += 1;
}

// La prueba de RN-10 necesita una incidencia con 6 días sin cambios: se envejece directamente.
async function envejecer(numeroCaso: string) {
  const url = new URL(process.env.Dcarv_POSTGRES_URL_NON_POOLING!);
  url.searchParams.delete('sslmode');
  const cliente = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  await cliente.query(
    `UPDATE incidencias SET fecha_estado = NOW() - INTERVAL '6 days' WHERE numero_caso = $1`,
    [numeroCaso],
  );
  await cliente.end();
}

async function main() {
  limpiar();
  const sala = await crearSala('Prueba Opcionales');
  await crearEquipo({ codigo: CODIGO, salaId: sala.id });
  const ana = await crearTecnico('Prueba Tecnico A');
  await crearTecnico('Prueba Tecnico B');

  try {
    await crearTecnico('prueba tecnico a');
    comprobar('Técnico duplicado rechazado', false);
  } catch (error) {
    comprobar(
      'Técnico duplicado rechazado',
      error instanceof ErrorDeNegocio && error.codigo === 'TECNICO_DUPLICADO',
    );
  }

  const { numeroCaso } = (await reportarIncidencia(CODIGO, 'No enciende')).incidencia;
  await reportarIncidencia(CODIGO, 'Sin internet');
  await asignarTecnico(numeroCaso, ana.id);
  const leer = async () =>
    (await listarIncidencias({ equipoCodigo: CODIGO })).find((i) => i.numeroCaso === numeroCaso);
  const asignada = await leer();
  comprobar(
    'Asignar pasa a en revisión con técnico',
    asignada?.estado === 'en_revision' && asignada.tecnico === 'Prueba Tecnico A',
  );

  try {
    await asignarTecnico(numeroCaso, ana.id);
    comprobar('Asignar una en revisión falla', false);
  } catch (error) {
    comprobar(
      'Asignar una en revisión falla',
      error instanceof ErrorDeNegocio && error.codigo === 'INCIDENCIA_NO_ASIGNABLE',
    );
  }

  comprobar('Sin vencidas no reasigna', (await reasignarIncidenciasVencidas()).reasignadas === 0);
  await envejecer(numeroCaso);
  const { reasignadas } = await reasignarIncidenciasVencidas();
  comprobar('Vencida reasignada a otro técnico', reasignadas === 1 && (await leer())?.tecnico === 'Prueba Tecnico B');

  comprobar('Dos incidencias no son alerta', !(await listarCandidatosABaja()).some((c) => c.codigo === CODIGO));
  await reportarIncidencia(CODIGO, 'Se apaga');
  comprobar(
    'Tres incidencias generan alerta',
    (await listarCandidatosABaja()).some((c) => c.codigo === CODIGO && c.incidencias30d === 3),
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
