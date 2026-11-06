import { execFileSync } from 'node:child_process';
import { conContexto, fijarActor, type Actor } from '@/lib/auth/contexto';
import {
  agregarComentario,
  asignarTecnico,
  avisosDe,
  cerrarConexion,
  cerrarIncidencia,
  clasificarIncidencia,
  contarMantenimientoPorEstado,
  crearEquipo,
  crearSala,
  crearTecnico,
  decidirSolicitud,
  estadoDeCuenta,
  eventosDeCaso,
  incidenciasPendientes,
  informeMensual,
  listarComentarios,
  listarUsuarios,
  marcarAvisosLeidos,
  obtenerIncidencia,
  paginarIncidencias,
  planDeMantenimiento,
  prepararCuentaNueva,
  programarMantenimiento,
  registrarMantenimiento,
  reportarIncidencia,
  solicitarSoporte,
} from '@/lib/dataService';
import { consultar } from '@/lib/db/conexion';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';
import { hoyBogota, sumarDias } from '@/lib/reglas/fechas';
import { mesDe } from '@/lib/reglas/informe';

// Prueba contra la base las funciones de la versión 2026-11-06: solicitudes de soporte,
// comentarios, avisos, categoría y prioridad, mantenimiento preventivo e informe mensual.
// Los datos se crean con el prefijo "Prueba" / "PV-NUE" y se borran antes y después
// (scripts/limpiar-prueba.mjs). Usa dos cuentas de prueba de la plantilla (dcarv.prueba+…@example.com)
// y una cuenta de soporte existente; lo que cambia en ellas se deshace al final.
let fallas = 0;
const inicio = new Date().toISOString();

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

// Ejecuta como si lo pidiera esa cuenta (el actor que leen los avisos y el registro de cambios).
function como<T>(actor: Actor, trabajo: () => Promise<T>): Promise<T> {
  return conContexto(async () => {
    fijarActor(actor);
    return trabajo();
  });
}

let cuentasDePrueba: string[] = [];

async function main() {
  limpiar();
  const usuarios = await listarUsuarios();
  const admin = usuarios.find((u) => u.rol === 'admin');
  const [uno, dos] = usuarios.filter((u) => u.rol === 'viewer' && u.email.startsWith('dcarv.prueba+'));
  if (!admin || !uno || !dos) throw new Error('Faltan cuentas: un administrador y dos cuentas dcarv.prueba+… de reporte.');
  cuentasDePrueba = [uno.id, dos.id];
  const soporte: Actor = { id: admin.id, email: admin.email, rol: 'admin' };
  const reporte: Actor = { id: uno.id, email: uno.email, rol: 'viewer' };
  const otra: Actor = { id: dos.id, email: dos.email, rol: 'viewer' };
  const soporteAutor = { id: soporte.id, email: soporte.email, soporte: true };
  const reporteAutor = { id: reporte.id, email: reporte.email, soporte: false };

  const sala = await crearSala('Prueba Nuevas');
  await crearEquipo({ codigo: 'PV-NUE-01', salaId: sala.id });
  await crearEquipo({ codigo: 'PV-NUE-02', salaId: sala.id });
  const tecnico = await crearTecnico('Prueba Técnico Nuevo');

  // Reporte de una cuenta de reporte: categoría propia, prioridad "media" y aviso a soporte.
  const { incidencia: caso } = await como(reporte, () =>
    reportarIncidencia('PV-NUE-01', 'Prueba: no hay internet', { reportadoPor: reporte.id, categoria: 'red' }),
  );
  await paso('Reporte de una cuenta de reporte: categoría elegida y prioridad media', async () =>
    caso.categoria === 'red' && caso.prioridad === 'media' && caso.comentarios === 0,
  );
  await paso('…y le llega a la campana de soporte (no a quien reportó)', async () => {
    const deSoporte = await avisosDe(soporte.id, { limite: 20 });
    const propios = await avisosDe(reporte.id, { limite: 20 });
    return (
      deSoporte.avisos.some((a) => a.tipo === 'reporte_nuevo' && a.enlace === `/soporte/incidencias/${caso.numeroCaso}`) &&
      !propios.avisos.some((a) => a.enlace.includes(caso.numeroCaso))
    );
  });

  // Lo que reporta soporte no llena la campana de soporte.
  const { incidencia: urgente } = await como(soporte, () =>
    reportarIncidencia('PV-NUE-02', 'Prueba: no enciende', { reportadoPor: soporte.id, categoria: 'hardware', prioridad: 'alta' }),
  );
  await paso('Reporte de soporte con prioridad alta, sin aviso a su propia campana', async () => {
    const { avisos } = await avisosDe(soporte.id, { limite: 30 });
    return urgente.prioridad === 'alta' && !avisos.some((a) => a.enlace.includes(urgente.numeroCaso));
  });
  await paso('"Requiere atención": la prioridad alta va primero', async () => {
    const { filas } = await incidenciasPendientes(200);
    const indice = (numero: string) => filas.findIndex((f) => f.numeroCaso === numero);
    return indice(urgente.numeroCaso) >= 0 && indice(urgente.numeroCaso) < indice(caso.numeroCaso);
  });

  // Clasificación.
  await paso('Clasificar: cambia y queda en el recorrido del caso; repetir no anota nada', async () => {
    await como(soporte, () => clasificarIncidencia(caso.numeroCaso, { prioridad: 'alta', categoria: 'software' }));
    const antes = (await eventosDeCaso(caso.numeroCaso)).length;
    await como(soporte, () => clasificarIncidencia(caso.numeroCaso, { prioridad: 'alta' }));
    const eventos = await eventosDeCaso(caso.numeroCaso);
    const ficha = await obtenerIncidencia(caso.numeroCaso);
    return (
      ficha?.prioridad === 'alta' &&
      ficha.categoria === 'software' &&
      eventos.length === antes &&
      eventos.some((e) => e.accion === 'incidencia_clasificada' && e.detalle.includes('Media → Alta'))
    );
  });
  await paso('Filtros por categoría y prioridad', async () => {
    const { filas } = await paginarIncidencias({ salaId: sala.id, categoria: 'software', prioridad: 'alta' }, 1, 50);
    return filas.length === 1 && filas[0]?.numeroCaso === caso.numeroCaso;
  });
  await paso('Clasificar un caso inexistente → INCIDENCIA_NO_ENCONTRADA', () =>
    falla(() => clasificarIncidencia('INC-99999999', { prioridad: 'baja' }), 'INCIDENCIA_NO_ENCONTRADA'),
  );

  // Ficha del caso.
  await paso('Ficha del caso: sala, quién lo reportó y cuándo', async () => {
    const ficha = await obtenerIncidencia(caso.numeroCaso.toLowerCase());
    return ficha?.sala === 'Prueba Nuevas' && ficha.reportadoPorId === reporte.id && /Z$/.test(ficha.creadaEn);
  });

  // Conversación y avisos.
  await paso('Soporte comenta → aviso a quien reportó', async () => {
    await como(soporte, () => agregarComentario(caso.numeroCaso, '  Se revisó el cable de red.  ', soporteAutor));
    const { avisos } = await avisosDe(reporte.id, { limite: 20 });
    return avisos.some((a) => a.tipo === 'comentario' && a.enlace.endsWith('#conversacion') && a.detalle.startsWith('Soporte:'));
  });
  await paso('Quien reportó responde → aviso a soporte', async () => {
    await como(reporte, () => agregarComentario(caso.numeroCaso, 'Sigue sin conectar.', reporteAutor));
    const { avisos } = await avisosDe(soporte.id, { limite: 20 });
    return avisos.some((a) => a.tipo === 'comentario' && a.detalle.startsWith(reporte.email));
  });
  await paso('Otra cuenta de reporte no comenta un caso ajeno (responde "no existe")', () =>
    falla(
      () => como(otra, () => agregarComentario(caso.numeroCaso, 'Hola', { id: otra.id, email: otra.email, soporte: false })),
      'INCIDENCIA_NO_ENCONTRADA',
    ),
  );
  await paso('Comentario de 1 carácter → DATOS_INVALIDOS', () =>
    falla(() => agregarComentario(caso.numeroCaso, ' x ', soporteAutor), 'DATOS_INVALIDOS'),
  );
  await paso('La conversación sale en orden y con quién escribió', async () => {
    const comentarios = await listarComentarios(caso.numeroCaso);
    return (
      comentarios.length === 2 &&
      comentarios[0]?.texto === 'Se revisó el cable de red.' &&
      comentarios[0].deSoporte &&
      comentarios[1]?.autor === reporte.email &&
      !comentarios[1].deSoporte
    );
  });

  await paso('Asignar técnico → aviso "en revisión" a quien reportó', async () => {
    await como(soporte, () => asignarTecnico(caso.numeroCaso, tecnico.id));
    const { avisos } = await avisosDe(reporte.id, { limite: 20 });
    return avisos.some((a) => a.tipo === 'caso_asignado' && a.detalle.includes('Prueba Técnico Nuevo'));
  });
  await paso('Cerrar con nota → comentario de cierre y aviso con la solución', async () => {
    await como(soporte, () => cerrarIncidencia(caso.numeroCaso, { nota: 'Se cambió el cable de red.' }));
    const comentarios = await listarComentarios(caso.numeroCaso);
    const { avisos } = await avisosDe(reporte.id, { limite: 20 });
    return (
      comentarios.at(-1)?.tipo === 'cierre' &&
      comentarios.at(-1)?.texto === 'Se cambió el cable de red.' &&
      avisos.some((a) => a.tipo === 'caso_cerrado' && a.detalle === 'Solución: Se cambió el cable de red.')
    );
  });
  await paso('Un caso cerrado no recibe más comentarios → INCIDENCIA_CERRADA', () =>
    falla(() => como(reporte, () => agregarComentario(caso.numeroCaso, 'Gracias', reporteAutor)), 'INCIDENCIA_CERRADA'),
  );
  await paso('Avisos: marcar uno ajeno no hace nada; marcar los propios baja el número', async () => {
    const propios = await avisosDe(reporte.id, { limite: 50, soloSinLeer: true });
    const ajeno = (await avisosDe(soporte.id, { limite: 1 })).avisos[0];
    const ajenos = ajeno ? await marcarAvisosLeidos(reporte.id, [ajeno.id]) : 0;
    const ids = propios.avisos.filter((a) => a.enlace.includes(caso.numeroCaso)).map((a) => a.id);
    const marcados = await marcarAvisosLeidos(reporte.id, ids);
    const despues = await avisosDe(reporte.id, { limite: 50, soloSinLeer: true });
    return ajenos === 0 && marcados === ids.length && ids.length >= 3 && despues.sinLeer === propios.sinLeer - ids.length;
  });

  // Solicitudes de soporte.
  await paso('Cuenta nueva sin correo institucional: no abre solicitud', async () => {
    const { solicitud } = await prepararCuentaNueva(otra.id);
    return !solicitud && (await estadoDeCuenta(otra.id))?.solicitud === null;
  });
  await paso('Pedir soporte sin correo institucional → SIN_PERMISO', () => falla(() => solicitarSoporte(otra.id), 'SIN_PERMISO'));
  await paso('Decidir sin solicitud pendiente → SIN_SOLICITUD', () => falla(() => decidirSolicitud(otra.id, true), 'SIN_SOLICITUD'));
  await paso('Rechazar: sigue de reporte, la solicitud se cierra y llega el aviso', async () => {
    await consultar('UPDATE public.users SET solicitud_soporte = now() WHERE id = $1', [otra.id]);
    await como(soporte, () => decidirSolicitud(otra.id, false));
    const estado = await estadoDeCuenta(otra.id);
    const { avisos } = await avisosDe(otra.id, { limite: 5 });
    return estado?.rol === 'viewer' && estado.solicitud === null && avisos[0]?.tipo === 'solicitud_rechazada';
  });
  await paso('Aprobar: pasa a Soporte técnico y llega el aviso', async () => {
    await consultar('UPDATE public.users SET solicitud_soporte = now() WHERE id = $1', [otra.id]);
    await como(soporte, () => decidirSolicitud(otra.id, true));
    const estado = await estadoDeCuenta(otra.id);
    const { avisos } = await avisosDe(otra.id, { limite: 5 });
    return estado?.rol === 'editor' && estado.solicitud === null && avisos[0]?.tipo === 'solicitud_aprobada';
  });

  // Mantenimiento preventivo.
  const hoy = hoyBogota();
  const planDe = async () => (await planDeMantenimiento(hoy)).find((p) => p.salaId === sala.id);
  await paso('Sala sin plan', async () => (await planDe())?.estado === 'sin_plan');
  await paso('Programar cada 30 días: la cuenta empieza hoy (al día)', async () => {
    await como(soporte, () => programarMantenimiento(sala.id, 30));
    const plan = await planDe();
    return plan?.cadaDias === 30 && plan.desde === hoy && plan.proximo === sumarDias(hoy, 30) && plan.estado === 'al_dia';
  });
  await paso('Un mantenimiento de hace 40 días deja la sala vencida', async () => {
    await como(soporte, () => registrarMantenimiento(sala.id, sumarDias(hoy, -40), 'Prueba limpieza'));
    const plan = await planDe();
    return plan?.estado === 'vencido' && plan.ultimo === sumarDias(hoy, -40) && plan.ultimasNotas === 'Prueba limpieza';
  });
  await paso('Registrar el de hoy la pone al día', async () => {
    await como(soporte, () => registrarMantenimiento(sala.id, hoy, ''));
    const plan = await planDe();
    return plan?.estado === 'al_dia' && plan.realizados === 2;
  });
  await paso('Fecha futura → DATOS_INVALIDOS; frecuencia de 3 días → DATOS_INVALIDOS', async () =>
    (await falla(() => registrarMantenimiento(sala.id, sumarDias(hoy, 1), ''), 'DATOS_INVALIDOS')) &&
    (await falla(() => programarMantenimiento(sala.id, 3), 'DATOS_INVALIDOS')),
  );
  await paso('Conteo por estado coincide con el plan', async () => {
    const planes = await planDeMantenimiento(hoy);
    const conteo = contarMantenimientoPorEstado(planes);
    return conteo.vencido + conteo.proximo + conteo.al_dia + conteo.sin_plan === planes.length;
  });

  // Informe mensual.
  await paso('Informe del mes: cuenta los casos, el cierre, la sala y el mantenimiento de la prueba', async () => {
    const informe = await informeMensual(mesDe(hoy));
    const filaSala = informe.porSala.find((s) => s.salaId === sala.id);
    return (
      informe.resumen.reportadas >= 2 &&
      informe.resumen.cerradas >= 1 &&
      informe.porCategoria.software >= 1 &&
      informe.porPrioridad.alta >= 2 &&
      filaSala?.reportadas === 2 &&
      filaSala.cerradas === 1 &&
      informe.porTecnico.some((t) => t.tecnico === 'Prueba Técnico Nuevo' && t.cerradas === 1) &&
      informe.mantenimientos.some((m) => m.salaId === sala.id && m.fecha === hoy)
    );
  });

  await paso('Quitar el plan', async () => {
    await como(soporte, () => programarMantenimiento(sala.id, null));
    return (await planDe())?.estado === 'sin_plan';
  });
}

// Deja las cuentas de la plantilla como estaban y borra lo que la prueba les dejó.
async function restaurarCuentas() {
  if (!cuentasDePrueba.length) return;
  await consultar(
    `UPDATE public.users SET role = 'viewer', solicitud_soporte = NULL, updated_at = now() WHERE id = ANY($1::uuid[])`,
    [cuentasDePrueba],
  );
  await consultar('DELETE FROM avisos WHERE usuario_id = ANY($1::uuid[]) AND creado_en >= $2', [cuentasDePrueba, inicio]);
  await consultar(
    `DELETE FROM eventos WHERE momento >= $1 AND accion LIKE 'solicitud_%'
       AND detalle IN (SELECT email FROM public.users WHERE id = ANY($2::uuid[]))`,
    [inicio, cuentasDePrueba],
  );
}

main()
  .catch((error) => {
    console.error(error);
    fallas += 1;
  })
  .finally(async () => {
    try {
      await restaurarCuentas();
    } catch (error) {
      console.error('No se pudieron restaurar las cuentas de prueba:', error);
      fallas += 1;
    }
    limpiar();
    await cerrarConexion();
    console.log(`\nFallas: ${fallas}`);
    process.exitCode = fallas ? 1 : 0;
  });
