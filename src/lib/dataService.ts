import { createSupabaseAdminClient } from '@/lib/supabase/server';

export { cerrarConexion } from '@/lib/db/conexion';
export { crearSala, eliminarSala, listarSalas, renombrarSala } from '@/lib/datos/salas';
export {
	cambiarEstadoEquipo,
	crearEquipo,
	listarEquipos,
	obtenerEquipo,
	paginarEquipos,
	trasladarEquipo,
} from '@/lib/datos/equipos';
export { cambiarColumnasMapa, mapaDeSala, moverEquipo } from '@/lib/datos/mapa';
export type { EquipoMapa, MapaSala } from '@/lib/datos/mapa';
export {
	actualizarRepuesto,
	contarBajoMinimo,
	crearRepuesto,
	listarRepuestos,
	repuestosDeCaso,
	usarRepuesto,
} from '@/lib/datos/repuestos';
export type { FilaRepuesto, RepuestoUsado } from '@/lib/datos/repuestos';
export { borrarSuscripcion, guardarSuscripcion, pushConfigurado } from '@/lib/datos/push';
export { actualizarHojaDeVida, avisosDeHojaDeVida, obtenerHojaDeVida } from '@/lib/datos/hojaDeVida';
export type { AvisoEquipo, FichaTecnica } from '@/lib/datos/hojaDeVida';
export { calificarIncidencia } from '@/lib/datos/calificaciones';
export {
	buscarArticulos,
	casosSimilares,
	crearArticulo,
	editarArticulo,
	eliminarArticulo,
	obtenerArticulo,
	votarArticulo,
} from '@/lib/datos/conocimiento';
export type { Articulo, CasoSimilar, DatosArticulo } from '@/lib/datos/conocimiento';
export { mapaDeCalor, riesgoDeEquipos, tendenciaDeSalas } from '@/lib/datos/analitica';
export type { MapaDeCalor, RiesgoEquipo, TendenciaSala } from '@/lib/datos/analitica';
export type { SuscripcionPush } from '@/lib/datos/push';
export { actividadReciente, serieActividad } from '@/lib/datos/panel';
export type { EventoActividad } from '@/lib/datos/panel';
export { buscarGlobal } from '@/lib/datos/busqueda';
export type { ResultadosBusqueda } from '@/lib/datos/busqueda';
export {
	cerrarIncidencia,
	clasificarIncidencia,
	contarIncidenciasPorEstado,
	datosDeFoto,
	guardarFoto,
	historialDeEquipo,
	incidenciasPendientes,
	listarIncidencias,
	obtenerIncidencia,
	paginarIncidencias,
	reportarIncidencia,
	resumenCierres,
} from '@/lib/datos/incidencias';
export type { DatosFoto, FiltrosIncidencias, OpcionesReporte, ResumenCierres } from '@/lib/datos/incidencias';
export { agregarComentario, listarComentarios } from '@/lib/datos/comentarios';
export type { Autor, FilaComentario } from '@/lib/datos/comentarios';
export { avisosDe, contarSinLeer, marcarAvisosLeidos } from '@/lib/datos/avisos';
export type { FilaAviso, ResumenAvisos } from '@/lib/datos/avisos';
export {
	contarPorEstado as contarMantenimientoPorEstado,
	historialMantenimientos,
	planDeMantenimiento,
	programarMantenimiento,
	registrarMantenimiento,
} from '@/lib/datos/mantenimiento';
export type { ConteoMantenimiento, FilaMantenimiento, FilaPlanMantenimiento } from '@/lib/datos/mantenimiento';
export { informeMensual, primerMesConDatos } from '@/lib/datos/informe';
export type {
	FilaBajaInforme,
	FilaEquipoInforme,
	FilaSalaInforme,
	FilaSlaInforme,
	SatisfaccionInforme,
	FilaTecnicoInforme,
	Informe,
	ResumenMes,
} from '@/lib/datos/informe';
export { actoresDeEventos, eventosDeCaso, eventosDeEquipo, eventosRecientes } from '@/lib/datos/eventos';
export type { AccionEvento, FiltrosEventos, FilaEvento } from '@/lib/datos/eventos';
export { intentosRecientes, registrarIntento } from '@/lib/datos/accesos';
export {
	cambiarRol,
	decidirSolicitud,
	eliminarCuenta,
	estadoDeCuenta,
	listarUsuarios,
	prepararCuentaNueva,
	rolActual,
	solicitarSoporte,
} from '@/lib/datos/usuarios';
export type { EstadoCuenta, FilaUsuario } from '@/lib/datos/usuarios';
export {
	asignarTecnico,
	cambiarActividadTecnico,
	crearTecnico,
	listarCandidatosABaja,
	listarEnObservacion,
	listarTecnicos,
	reasignarIncidenciasVencidas,
	renombrarTecnico,
} from '@/lib/datos/tecnicos';
export type {
	CategoriaIncidencia,
	ConteoIncidencias,
	DetalleEquipo,
	EstadoEquipo,
	EstadoIncidencia,
	FichaCaso,
	FilaCandidato,
	FilaEquipo,
	FilaIncidencia,
	FilaSala,
	FilaTecnico,
	Pagina,
	PrioridadIncidencia,
	ResultadoActividad,
	ResultadoCierre,
	ResultadoIncidencia,
} from '@/lib/datos/tipos';

export type UsuarioRestablecimiento = { id: string; email: string };
export type TokenRestablecimiento = { id: string; usuario_id: string };

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioRestablecimiento | null> {
	const { data, error } = await createSupabaseAdminClient()
		.from('users')
		.select('id, email')
		.eq('email', email.trim().toLowerCase())
		.maybeSingle();
	if (error) throw new Error('No se pudo buscar el usuario.');
	return data;
}

export async function contarSolicitudesRestablecimiento(usuarioId: string): Promise<number> {
	const { data, error } = await createSupabaseAdminClient()
		.rpc('contar_solicitudes_restablecimiento', { p_usuario_id: usuarioId });
	if (error) throw new Error('No se pudo contar las solicitudes.');
	return Number(data ?? 0);
}

export async function invalidarTokensPendientes(usuarioId: string): Promise<void> {
	const { error } = await createSupabaseAdminClient()
		.rpc('invalidar_tokens_restablecimiento', { p_usuario_id: usuarioId });
	if (error) throw new Error('No se pudieron invalidar los enlaces anteriores.');
}

export async function crearTokenRestablecimiento(
	usuarioId: string,
	tokenHash: string,
	expiraEn: string,
): Promise<void> {
	const { error } = await createSupabaseAdminClient()
		.from('restablecimientos_contrasena')
		.insert({ usuario_id: usuarioId, token_hash: tokenHash, expira_en: expiraEn });
	if (error) throw new Error('No se pudo guardar el enlace de recuperación.');
}

export async function buscarTokenVigente(tokenHash: string): Promise<TokenRestablecimiento | null> {
	const { data, error } = await createSupabaseAdminClient()
		.rpc('buscar_token_restablecimiento', { p_token_hash: tokenHash });
	if (error) throw new Error('No se pudo validar el enlace.');
	return (data as TokenRestablecimiento[] | null)?.[0] ?? null;
}

export async function marcarTokenComoUsado(tokenId: string): Promise<boolean> {
	const { data, error } = await createSupabaseAdminClient()
		.rpc('marcar_token_restablecimiento_usado', { p_token_id: tokenId });
	if (error) throw new Error('No se pudo consumir el enlace.');
	return data === true;
}

export async function actualizarContrasenaUsuario(usuarioId: string, contrasena: string): Promise<void> {
	const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(usuarioId, { password: contrasena });
	if (error) throw new Error('No se pudo actualizar la contraseña.');
}