import type { PoolClient } from 'pg';
import { DIAS_VENTANA_ALERTA, LIMITE_LISTADO } from '@/lib/config/soporte';
import { conTransaccion, consultar, crearParametros } from '@/lib/db/conexion';
import {
  ETIQUETA_EQUIPO,
  esEstadoEquipoValido,
  normalizarCodigo,
  validarDatosEquipo,
  type EstadoEquipo,
} from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, inicioVentana } from '@/lib/reglas/fechas';
import { desplazamiento } from '@/lib/reglas/paginacion';
import { consultarHistorial } from './incidencias';
import { registrarEvento } from './eventos';
import { aPagina } from './paginar';
import { obtenerSalaActiva } from './salas';
import type { DetalleEquipo, FilaEquipo, Pagina } from './tipos';

type FiltrosEquipos = {
  salaId?: string | undefined;
  estado?: EstadoEquipo | undefined;
  busqueda?: string | undefined;
};

// El conteo de 30 días usa la fecha de Bogotá como parámetro (RN-09), igual que las alertas.
// La vista v_equipos cuenta con CURRENT_DATE de la base (UTC) y entre las 19:00 y las 24:00 de
// Colombia ya va un día adelante: la tabla y las alertas podían no coincidir.
function seleccion(p: (valor: unknown) => string, extra = ''): string {
  const desde = p(inicioVentana(hoyBogota(), DIAS_VENTANA_ALERTA));
  return `SELECT ${extra} e.codigo, e.sala_id AS "salaId", s.nombre AS sala, e.estado,
                 (SELECT COUNT(*) FROM incidencias i
                   WHERE i.equipo_id = e.id AND i.fecha >= ${desde}::date) AS "incidencias30d"
            FROM equipos e
            JOIN salas s ON s.id = e.sala_id`;
}

export async function paginarEquipos(
  f: FiltrosEquipos,
  pagina: number,
  tamano: number,
): Promise<Pagina<FilaEquipo>> {
  const { valores, p } = crearParametros();
  // COUNT(*) OVER () se calcula antes del LIMIT: trae el total de coincidencias en la misma consulta.
  const base = seleccion(p, 'COUNT(*) OVER () AS "totalFilas",');
  const condiciones: string[] = [];
  if (f.salaId) condiciones.push(`e.sala_id = ${p(f.salaId)}`);
  if (f.estado) condiciones.push(`e.estado = ${p(f.estado)}`);
  const busqueda = f.busqueda ? normalizarCodigo(f.busqueda) : '';
  if (busqueda) {
    condiciones.push(`e.codigo ILIKE ${p(`%${busqueda.replace(/[\\%_]/g, '\\$&')}%`)} ESCAPE '\\'`);
  }
  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const filas = await consultar<FilaEquipo & { totalFilas: number }>(
    `${base} ${donde} ORDER BY e.codigo
      LIMIT ${p(tamano)} OFFSET ${p(desplazamiento(pagina, tamano))}`,
    valores,
  );
  return aPagina(filas, pagina, tamano);
}

// Listado sin paginar (API y scripts): conserva el tope de seguridad LIMITE_LISTADO.
export async function listarEquipos(f: FiltrosEquipos = {}): Promise<FilaEquipo[]> {
  return (await paginarEquipos(f, 1, LIMITE_LISTADO)).filas;
}

export async function crearEquipo(d: {
  codigo: string;
  salaId: string;
}): Promise<{ id: string; codigo: string }> {
  validarDatosEquipo({ codigo: d.codigo, sala: d.salaId });
  return conTransaccion(async (tx) => {
    const sala = await obtenerSalaActiva(tx, d.salaId);
    const { rows } = await tx.query<{ id: string; codigo: string }>(
      'INSERT INTO equipos (codigo, sala_id) VALUES ($1, $2) RETURNING id, codigo', // RN-02
      [normalizarCodigo(d.codigo), d.salaId],
    );
    await registrarEvento(tx, { accion: 'equipo_registrado', equipoCodigo: rows[0]!.codigo, detalle: `en ${sala.nombre}` });
    return rows[0]!;
  });
}

export async function obtenerEquipo(codigo: string): Promise<DetalleEquipo> {
  const limpio = normalizarCodigo(codigo);
  const { valores, p } = crearParametros();
  const base = seleccion(p);
  const [equipo] = await consultar<FilaEquipo>(`${base} WHERE e.codigo = ${p(limpio)}`, valores);
  if (!equipo) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  return { equipo, historial: await consultarHistorial(limpio) };
}

// RN-07: cualquier estado, sin secuencia. Queda en el registro de cambios solo si cambió.
export async function cambiarEstadoEquipo(codigo: string, estado: string): Promise<void> {
  if (!esEstadoEquipoValido(estado)) throw new ErrorDeNegocio('ESTADO_INVALIDO');
  await conTransaccion(async (tx) => {
    const equipo = await obtenerEquipoPorCodigo(tx, codigo);
    if (equipo.estado === estado) return;
    await tx.query('UPDATE equipos SET estado = $1 WHERE id = $2', [estado, equipo.id]);
    await registrarEvento(tx, {
      accion: 'estado_equipo',
      equipoCodigo: normalizarCodigo(codigo),
      detalle: `${ETIQUETA_EQUIPO[equipo.estado]} → ${ETIQUETA_EQUIPO[estado]}`,
    });
  });
}

// Trasladar un equipo a otra sala (inventario que cambia de lugar). El código, el estado y el
// historial no cambian; solo la sala. La sala destino debe existir.
export async function trasladarEquipo(codigo: string, salaId: string): Promise<{ sala: string }> {
  return conTransaccion(async (tx) => {
    const equipo = await obtenerEquipoPorCodigo(tx, codigo);
    const sala = await obtenerSalaActiva(tx, salaId);
    await tx.query('UPDATE equipos SET sala_id = $1 WHERE id = $2', [sala.id, equipo.id]);
    await registrarEvento(tx, { accion: 'equipo_trasladado', equipoCodigo: normalizarCodigo(codigo), detalle: `a ${sala.nombre}` });
    return { sala: sala.nombre };
  });
}

// FOR UPDATE: un cambio de estado simultáneo espera a que termine el reporte.
export async function obtenerEquipoPorCodigo(
  tx: PoolClient,
  codigo: string,
): Promise<{ id: string; estado: EstadoEquipo }> {
  const { rows } = await tx.query<{ id: string; estado: EstadoEquipo }>(
    'SELECT id, estado FROM equipos WHERE codigo = $1 FOR UPDATE',
    [normalizarCodigo(codigo)],
  );
  if (!rows[0]) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
  return rows[0];
}
