import { z } from 'zod';
import {
  CATEGORIAS_INCIDENCIA,
  ESTADOS_EQUIPO,
  ESTADOS_INCIDENCIA,
  LARGO_MAXIMO_COMENTARIO,
  LARGO_MAXIMO_NOTAS_MANTENIMIENTO,
  LARGO_MINIMO_COMENTARIO,
  MAXIMO_CANTIDAD_REPUESTO,
  MAXIMO_COLUMNAS_MAPA,
  MAXIMO_DIAS_MANTENIMIENTO,
  MAXIMO_EXISTENCIAS_REPUESTO,
  MAXIMO_FILAS_MAPA,
  MINIMO_COLUMNAS_MAPA,
  MINIMO_DIAS_MANTENIMIENTO,
  PRIORIDADES_INCIDENCIA,
} from '@/lib/config/soporte';

// Los filtros llegan de la URL: un parámetro vacío equivale a no filtrar.
const opcional = <T extends z.ZodType>(esquema: T) =>
  z.preprocess((valor) => (valor === '' ? undefined : valor), esquema.optional());

export const esquemaSala = z.object({
  nombre: z.string().trim().min(1, 'Escriba el nombre de la sala.').max(80),
});

export const esquemaEquipo = z.object({
  codigo: z.string().trim().min(1, 'Escriba el código del equipo.').max(40),
  salaId: z.uuid('Seleccione una sala.'),
});

export const esquemaEstadoEquipo = z.object({ estado: z.enum(ESTADOS_EQUIPO) });

export const esquemaIncidencia = z.object({
  descripcion: z
    .string()
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres.')
    .max(1000),
  // Opcionales para no romper clientes anteriores: sin categoría queda 'otro'; sin prioridad, 'media'.
  categoria: z.enum(CATEGORIAS_INCIDENCIA).optional(),
  // Solo cuenta si reporta soporte (la ruta la ignora para una cuenta de reporte).
  prioridad: z.enum(PRIORIDADES_INCIDENCIA).optional(),
});

export const esquemaFiltrosEquipos = z.object({
  salaId: opcional(z.uuid()),
  estado: opcional(z.enum(ESTADOS_EQUIPO)),
  busqueda: opcional(z.string().trim().max(40)),
});

export const esquemaFiltrosIncidencias = z.object({
  estado: opcional(z.enum(ESTADOS_INCIDENCIA)),
  equipoCodigo: opcional(z.string().trim().max(40)),
  busqueda: opcional(z.string().trim().max(80)),
  tecnicoId: opcional(z.uuid()),
  salaId: opcional(z.uuid()),
  categoria: opcional(z.enum(CATEGORIAS_INCIDENCIA)),
  prioridad: opcional(z.enum(PRIORIDADES_INCIDENCIA)),
});

const nombreTecnico = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(100, 'El nombre no puede pasar de 100 caracteres.');

export const esquemaTecnico = z.object({ nombre: nombreTecnico });

// PATCH /api/soporte/tecnicos/[id]: renombrar, activar/desactivar, o ambas cosas.
export const esquemaActualizarTecnico = z
  .object({ nombre: nombreTecnico.optional(), activo: z.boolean().optional() })
  .refine((datos) => datos.nombre !== undefined || datos.activo !== undefined, {
    message: 'Indique el nombre o el estado del técnico.',
  });

export const esquemaAsignar = z.object({ tecnicoId: z.uuid('Seleccione un técnico.') });

const textoComentario = z
  .string()
  .trim()
  .min(LARGO_MINIMO_COMENTARIO, `Escriba al menos ${LARGO_MINIMO_COMENTARIO} caracteres.`)
  .max(LARGO_MAXIMO_COMENTARIO, `Máximo ${LARGO_MAXIMO_COMENTARIO} caracteres.`);

// Al cerrar: devolver el equipo a funcional y dejar la nota de solución (ambos opcionales).
export const esquemaCerrar = z.object({
  equipoFuncional: z.boolean().optional(),
  nota: z.preprocess((v) => (typeof v === 'string' && !v.trim() ? undefined : v), textoComentario.optional()),
});

export const esquemaComentario = z.object({ texto: textoComentario });

// PATCH /api/soporte/incidencias/[numero]: corregir la categoría o la prioridad.
export const esquemaClasificar = z
  .object({ categoria: z.enum(CATEGORIAS_INCIDENCIA).optional(), prioridad: z.enum(PRIORIDADES_INCIDENCIA).optional() })
  .refine((datos) => datos.categoria !== undefined || datos.prioridad !== undefined, {
    message: 'Indique la categoría o la prioridad.',
  });

// Número de caso de una ruta dinámica: INC-0001 (también en minúsculas).
export const esquemaNumeroCaso = z
  .string()
  .trim()
  .regex(/^inc-\d{4,}$/i, 'Número de caso no válido.')
  .transform((v) => v.toUpperCase());

export const esquemaDecisionSolicitud = z.object({ aprobar: z.boolean() });

// Avisos: sin ids se marcan todos como leídos.
export const esquemaAvisosLeidos = z.object({ ids: z.array(z.number().int().positive()).max(100).optional() });

export const esquemaListaAvisos = z.object({
  antesDe: opcional(z.coerce.number().int().positive()),
  limite: opcional(z.coerce.number().int().min(1).max(50)),
  soloSinLeer: opcional(z.enum(['1'])),
});

export const esquemaFechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escriba una fecha válida.');

export const esquemaMantenimiento = z.object({
  salaId: z.uuid('Seleccione una sala.'),
  fecha: esquemaFechaIso,
  notas: z.string().trim().max(LARGO_MAXIMO_NOTAS_MANTENIMIENTO, `Máximo ${LARGO_MAXIMO_NOTAS_MANTENIMIENTO} caracteres.`).default(''),
});

// cadaDias null quita el plan de la sala.
export const esquemaPlanMantenimiento = z.object({
  salaId: z.uuid('Seleccione una sala.'),
  cadaDias: z
    .number()
    .int('Escriba un número entero de días.')
    .min(MINIMO_DIAS_MANTENIMIENTO, `Mínimo ${MINIMO_DIAS_MANTENIMIENTO} días.`)
    .max(MAXIMO_DIAS_MANTENIMIENTO, `Máximo ${MAXIMO_DIAS_MANTENIMIENTO} días.`)
    .nullable(),
});

export const esquemaTraslado = z.object({ salaId: z.uuid('Seleccione la sala de destino.') });

// Búsqueda global (Ctrl+K): mínimo 2 caracteres para no recorrer toda la base con una letra.
export const esquemaBusquedaGlobal = z.object({
  q: z.string().trim().min(2, 'Escriba al menos 2 caracteres.').max(60),
});

// Identificador de una ruta dinámica (/salas/[id], /tecnicos/[id]). Sin esto, un id mal formado
// llegaba a Postgres y respondía ERROR_INTERNO (500) en vez de un 400.
export const esquemaId = z.uuid('Identificador no válido.');

// Mapa de la sala (M12): puesto de un equipo y ancho del mapa.
export const esquemaPuesto = z.object({
  fila: z.number().int().min(1).max(MAXIMO_FILAS_MAPA),
  columna: z.number().int().min(1).max(MAXIMO_COLUMNAS_MAPA),
});

export const esquemaColumnasMapa = z.object({
  columnas: z
    .number()
    .int()
    .min(MINIMO_COLUMNAS_MAPA, `Mínimo ${MINIMO_COLUMNAS_MAPA} columnas.`)
    .max(MAXIMO_COLUMNAS_MAPA, `Máximo ${MAXIMO_COLUMNAS_MAPA} columnas.`),
});

// Repuestos (M13).
const existencias = z
  .number()
  .int('Escriba un número entero.')
  .min(0, 'No puede ser negativo.')
  .max(MAXIMO_EXISTENCIAS_REPUESTO, `Máximo ${MAXIMO_EXISTENCIAS_REPUESTO}.`);
const cantidad = z
  .number()
  .int('Escriba un número entero.')
  .min(1, 'Mínimo 1.')
  .max(MAXIMO_CANTIDAD_REPUESTO, `Máximo ${MAXIMO_CANTIDAD_REPUESTO}.`);

export const esquemaRepuesto = z.object({
  nombre: z.string().trim().min(2, 'Escriba al menos 2 caracteres.').max(80),
  existencias,
  minimo: existencias,
});

export const esquemaActualizarRepuesto = z
  .object({ entrada: cantidad.optional(), minimo: existencias.optional() })
  .refine((datos) => datos.entrada !== undefined || datos.minimo !== undefined, {
    message: 'Indique la entrada o el mínimo.',
  });

export const esquemaUsoRepuesto = z.object({ repuestoId: z.uuid('Seleccione un repuesto.'), cantidad });

// Notificaciones push (M14): la suscripción que entrega el navegador (PushSubscription.toJSON()).
export const esquemaSuscripcionPush = z.object({
  endpoint: z.url().startsWith('https://').max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

export const esquemaBajaPush = z.object({ endpoint: z.url().max(1000) });

export type DatosSala = z.infer<typeof esquemaSala>;
export type DatosEquipo = z.infer<typeof esquemaEquipo>;
export type DatosEstadoEquipo = z.infer<typeof esquemaEstadoEquipo>;
export type DatosIncidencia = z.infer<typeof esquemaIncidencia>;
export type FiltrosEquipos = z.infer<typeof esquemaFiltrosEquipos>;
export type FiltrosIncidencias = z.infer<typeof esquemaFiltrosIncidencias>;
export type DatosTecnico = z.infer<typeof esquemaTecnico>;
export type DatosAsignar = z.infer<typeof esquemaAsignar>;
