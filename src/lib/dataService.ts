import { createSupabaseAdminClient } from '@/lib/supabase/server';

export { cerrarConexion } from '@/lib/db/conexion';
export { crearSala, listarSalas } from '@/lib/datos/salas';
export {
	cambiarEstadoEquipo,
	crearEquipo,
	listarEquipos,
	obtenerEquipo,
} from '@/lib/datos/equipos';
export {
	cerrarIncidencia,
	contarIncidenciasPorEstado,
	historialDeEquipo,
	listarIncidencias,
	reportarIncidencia,
} from '@/lib/datos/incidencias';
export {
	asignarTecnico,
	crearTecnico,
	listarCandidatosABaja,
	listarTecnicos,
	reasignarIncidenciasVencidas,
} from '@/lib/datos/tecnicos';
export type {
	ConteoIncidencias,
	DetalleEquipo,
	EstadoEquipo,
	EstadoIncidencia,
	FilaCandidato,
	FilaEquipo,
	FilaIncidencia,
	FilaSala,
	FilaTecnico,
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