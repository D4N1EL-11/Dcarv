import nextEnv from '@next/env';
import pg from 'pg';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const nombreConexion = 'Dcarv_POSTGRES_URL_NON_POOLING';
const valorConexion = process.env[nombreConexion];

if (!valorConexion) {
	console.error(`Falta configurar ${nombreConexion}.`);
	process.exit(1);
}

const urlConexion = new URL(valorConexion);
urlConexion.searchParams.delete('sslmode');

const pool = new pg.Pool({
	connectionString: urlConexion.toString(),
	ssl: { rejectUnauthorized: false },
	max: 1,
	connectionTimeoutMillis: 15_000,
});

let fallas = 0;
let siguienteSavepoint = 0;

function resultado(ok, etiqueta, detalle = '') {
	console.log(`${ok ? 'OK' : 'FALLA'} - ${etiqueta}${detalle ? `: ${detalle}` : ''}`);
	if (!ok) fallas += 1;
}

async function comprobarErrorEsperado(client, nombre, consulta, valores, codigo, restriccion) {
	const savepoint = `sp_integridad_${++siguienteSavepoint}`;
	await client.query(`SAVEPOINT ${savepoint}`);
	try {
		await client.query(consulta, valores);
		await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
		await client.query(`RELEASE SAVEPOINT ${savepoint}`);
		resultado(false, nombre, `se esperaba ${codigo}${restriccion ? ` (${restriccion})` : ''}`);
	} catch (error) {
		await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
		await client.query(`RELEASE SAVEPOINT ${savepoint}`);
		const coincide = error.code === codigo && (!restriccion || error.constraint === restriccion);
		const recibido = `${error.code ?? 'sin código'}${error.constraint ? ` (${error.constraint})` : ''}`;
		resultado(coincide, nombre, coincide ? recibido : `se esperaba ${codigo}${restriccion ? ` (${restriccion})` : ''}; se recibió ${recibido}`);
	}
}

async function probarIntegridad() {
	const client = await pool.connect();
	let iniciada = false;
	try {
		await client.query('BEGIN');
		iniciada = true;

		const sala = await client.query(
			'INSERT INTO public.salas (nombre) VALUES ($1) RETURNING id',
			['Verif Sala'],
		);
		const salaId = sala.rows[0].id;

		await comprobarErrorEsperado(
			client,
			'a) nombre de sala sin distinción de mayúsculas',
			'INSERT INTO public.salas (nombre) VALUES ($1)',
			['verif sala'],
			'23505',
			'ux_salas_nombre',
		);

		const equipo = await client.query(
			'INSERT INTO public.equipos (codigo, sala_id) VALUES ($1, $2) RETURNING id, estado',
			['VERIF-01', salaId],
		);
		const equipoId = equipo.rows[0].id;
		resultado(equipo.rows[0].estado === 'funcional', 'b) estado funcional por defecto', equipo.rows[0].estado);

		await comprobarErrorEsperado(
			client,
			'c) código de equipo único',
			'INSERT INTO public.equipos (codigo, sala_id) VALUES ($1, $2)',
			['VERIF-01', salaId],
			'23505',
			'equipos_codigo_unico',
		);

		await comprobarErrorEsperado(
			client,
			"d) estado de equipo 'roto' rechazado",
			'INSERT INTO public.equipos (codigo, sala_id, estado) VALUES ($1, $2, $3)',
			['VERIF-02', salaId, 'roto'],
			'23514',
			'equipos_estado_valido',
		);

		const incidencia = await client.query(
			`INSERT INTO public.incidencias (numero_caso, equipo_id, descripcion, estado, fecha)
			 VALUES ('INC-' || LPAD(nextval('seq_numero_caso')::text, 4, '0'), $1, $2, $3, CURRENT_DATE)
			 RETURNING numero_caso`,
			[equipoId, 'No enciende', 'abierta'],
		);
		const numeroCaso = incidencia.rows[0].numero_caso;
		resultado(/^INC-\d{4,}$/.test(numeroCaso), 'e) número de caso por secuencia', numeroCaso);

		await comprobarErrorEsperado(
			client,
			"f) descripción 'ab' rechazada",
			`INSERT INTO public.incidencias (numero_caso, equipo_id, descripcion, estado, fecha)
			 VALUES ('INC-VERIF-F', $1, $2, 'abierta', CURRENT_DATE)`,
			[equipoId, 'ab'],
			'23514',
			'incidencias_desc_minima',
		);

		await comprobarErrorEsperado(
			client,
			"g) estado de incidencia 'pendiente' rechazado",
			`INSERT INTO public.incidencias (numero_caso, equipo_id, descripcion, estado, fecha)
			 VALUES ('INC-VERIF-G', $1, 'No enciende', $2, CURRENT_DATE)`,
			[equipoId, 'pendiente'],
			'23514',
			'incidencias_estado_valido',
		);
	} catch (error) {
		resultado(false, 'Pruebas de integridad', error.message);
	} finally {
		try {
			if (iniciada) await client.query('ROLLBACK');
		} finally {
			client.release();
		}
	}
}

async function main() {
	try {
		const objetos = await pool.query(`
			SELECT
				to_regclass('public.salas') IS NOT NULL AS salas,
				to_regclass('public.equipos') IS NOT NULL AS equipos,
				to_regclass('public.incidencias') IS NOT NULL AS incidencias,
				to_regclass('public.tecnicos') IS NOT NULL AS tecnicos,
				to_regclass('public.seq_numero_caso') IS NOT NULL AS secuencia,
				to_regclass('public.v_equipos') IS NOT NULL AS vista
		`);
		console.log('Existencia de objetos:');
		for (const [nombre, etiqueta] of [
			['salas', 'salas'],
			['equipos', 'equipos'],
			['incidencias', 'incidencias'],
			['tecnicos', 'tecnicos'],
			['secuencia', 'seq_numero_caso'],
			['vista', 'v_equipos'],
		]) {
			resultado(objetos.rows[0][nombre], etiqueta);
		}

		console.log('Filas por tabla:');
		for (const tabla of ['salas', 'equipos', 'incidencias', 'tecnicos']) {
			const conteo = await pool.query(`SELECT COUNT(*)::bigint AS total FROM public.${tabla}`);
			console.log(`${tabla}: ${conteo.rows[0].total}`);
		}

		const restricciones = await pool.query(`
			SELECT conname
			FROM pg_constraint
			WHERE conname IN ('equipos_codigo_unico', 'incidencias_numero_unico')
		`);
		const indices = await pool.query(`
			SELECT indexname
			FROM pg_indexes
			WHERE schemaname = 'public'
			  AND indexname = ANY($1::text[])
		`, [['ux_salas_nombre']]);
		const nombresRestricciones = new Set(restricciones.rows.map((fila) => fila.conname));
		const nombresIndices = new Set(indices.rows.map((fila) => fila.indexname));
		console.log('Restricciones e índices requeridos:');
		resultado(nombresRestricciones.has('equipos_codigo_unico'), 'equipos_codigo_unico');
		resultado(nombresIndices.has('ux_salas_nombre'), 'ux_salas_nombre');
		resultado(nombresRestricciones.has('incidencias_numero_unico'), 'incidencias_numero_unico');

		const rls = await pool.query(`
			SELECT relname, relrowsecurity
			FROM pg_class
			WHERE oid = ANY(ARRAY[
				to_regclass('public.salas'),
				to_regclass('public.equipos'),
				to_regclass('public.incidencias'),
				to_regclass('public.tecnicos')
			])
		`);
		const rlsPorTabla = new Map(rls.rows.map((fila) => [fila.relname, fila.relrowsecurity]));
		console.log('Row Level Security:');
		for (const tabla of ['salas', 'equipos', 'incidencias', 'tecnicos']) {
			resultado(rlsPorTabla.get(tabla) === true, `${tabla} RLS activo`);
		}

		console.log('Pruebas de integridad (transacción con ROLLBACK):');
		await probarIntegridad();
	} catch (error) {
		resultado(false, 'Verificación de la base de datos', error.message);
	} finally {
		await pool.end();
	}

	console.log(`Total de fallas: ${fallas}`);
	if (fallas > 0) process.exitCode = 1;
}

main();
