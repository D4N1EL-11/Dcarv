import type { PoolClient } from 'pg';
import { DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { conTransaccion, consultar } from '@/lib/db/conexion';
import { normalizarCodigo, type EstadoEquipo } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota, inicioVentana } from '@/lib/reglas/fechas';
import { distribuirEquipos, validarColumnasMapa, validarPuesto, type Puesto } from '@/lib/reglas/mapa';
import { registrarEvento } from './eventos';

// Mapa de cada sala (M12): la sala con su ancho y sus equipos con el puesto guardado (o null).
// El puesto final de los que no tienen uno lo decide lib/reglas/mapa.ts al dibujar.

export type EquipoMapa = {
  codigo: string;
  estado: EstadoEquipo;
  fila: number | null;
  columna: number | null;
  incidencias30d: number;
  pendientes: number;
};

export type MapaSala = {
  sala: { id: string; nombre: string; columnas: number };
  equipos: EquipoMapa[];
};

export async function mapaDeSala(salaId: string): Promise<MapaSala> {
  const [sala] = await consultar<MapaSala['sala']>(
    'SELECT id, nombre, mapa_columnas AS columnas FROM salas WHERE id = $1',
    [salaId],
  );
  if (!sala) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
  const equipos = await consultar<EquipoMapa>(
    `SELECT e.codigo, e.estado, e.fila, e.columna,
            (SELECT COUNT(*) FROM incidencias i WHERE i.equipo_id = e.id AND i.fecha >= $2::date) AS "incidencias30d",
            (SELECT COUNT(*) FROM incidencias i WHERE i.equipo_id = e.id AND i.estado <> 'cerrada') AS pendientes
       FROM equipos e
      WHERE e.sala_id = $1
      ORDER BY e.codigo`,
    [salaId, inicioVentana(hoyBogota(), DIAS_VENTANA_ALERTA)],
  );
  return { sala, equipos };
}

// Guarda el puesto que hoy se dibuja automáticamente para cada equipo de la sala: después de la
// primera edición el mapa queda estable y mover un equipo no corre a los demás.
async function fijarPuestos(tx: PoolClient, salaId: string, columnas: number): Promise<void> {
  const { rows } = await tx.query<{ id: string; fila: number | null; columna: number | null }>(
    'SELECT id, fila, columna FROM equipos WHERE sala_id = $1 ORDER BY codigo FOR UPDATE',
    [salaId],
  );
  const { equipos } = distribuirEquipos(rows, columnas);
  for (const equipo of equipos) {
    if (!equipo.automatico) continue;
    await tx.query('UPDATE equipos SET fila = $1, columna = $2 WHERE id = $3', [equipo.fila, equipo.columna, equipo.id]);
  }
}

// Mueve un equipo a un puesto de su sala. Si el puesto está ocupado, los dos se intercambian.
export async function moverEquipo(codigo: string, puesto: Puesto): Promise<void> {
  const limpio = normalizarCodigo(codigo);
  await conTransaccion(async (tx) => {
    const { rows } = await tx.query<{ id: string; salaId: string; columnas: number }>(
      `SELECT e.id, e.sala_id AS "salaId", s.mapa_columnas AS columnas
         FROM equipos e JOIN salas s ON s.id = e.sala_id
        WHERE e.codigo = $1
          FOR UPDATE OF s`,
      [limpio],
    );
    const equipo = rows[0];
    if (!equipo) throw new ErrorDeNegocio('EQUIPO_NO_ENCONTRADO');
    validarPuesto(puesto, equipo.columnas);
    await fijarPuestos(tx, equipo.salaId, equipo.columnas);

    const actual = await tx.query<{ fila: number; columna: number }>('SELECT fila, columna FROM equipos WHERE id = $1', [
      equipo.id,
    ]);
    const origen = actual.rows[0]!;
    if (origen.fila === puesto.fila && origen.columna === puesto.columna) return;

    const ocupante = await tx.query<{ id: string; codigo: string }>(
      'SELECT id, codigo FROM equipos WHERE sala_id = $1 AND fila = $2 AND columna = $3 AND id <> $4',
      [equipo.salaId, puesto.fila, puesto.columna, equipo.id],
    );
    // El índice único ux_equipos_puesto no admite dos equipos en un puesto ni a mitad del cambio:
    // primero se libera el puesto de origen.
    await tx.query('UPDATE equipos SET fila = NULL, columna = NULL WHERE id = $1', [equipo.id]);
    if (ocupante.rows[0]) {
      await tx.query('UPDATE equipos SET fila = $1, columna = $2 WHERE id = $3', [
        origen.fila,
        origen.columna,
        ocupante.rows[0].id,
      ]);
    }
    await tx.query('UPDATE equipos SET fila = $1, columna = $2 WHERE id = $3', [puesto.fila, puesto.columna, equipo.id]);
    await registrarEvento(tx, {
      accion: 'equipo_movido',
      equipoCodigo: limpio,
      detalle: ocupante.rows[0]
        ? `(intercambio con ${ocupante.rows[0].codigo})`
        : `a la fila ${puesto.fila}, puesto ${puesto.columna}`,
    });
  });
}

// Cambia el ancho del mapa. Los equipos que quedan fuera pierden su puesto y se dibujan en el
// primer puesto libre.
export async function cambiarColumnasMapa(salaId: string, columnas: number): Promise<void> {
  validarColumnasMapa(columnas);
  await conTransaccion(async (tx) => {
    const { rowCount } = await tx.query('UPDATE salas SET mapa_columnas = $1 WHERE id = $2', [columnas, salaId]);
    if (!rowCount) throw new ErrorDeNegocio('SALA_NO_ENCONTRADA');
    await tx.query('UPDATE equipos SET fila = NULL, columna = NULL WHERE sala_id = $1 AND columna > $2', [
      salaId,
      columnas,
    ]);
  });
}
