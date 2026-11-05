import { z } from 'zod';
import { ESTADOS_EQUIPO, ESTADOS_INCIDENCIA } from '@/lib/config/soporte';

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

export const esquemaCerrar = z.object({ equipoFuncional: z.boolean().optional() });

// Identificador de una ruta dinámica (/salas/[id], /tecnicos/[id]). Sin esto, un id mal formado
// llegaba a Postgres y respondía ERROR_INTERNO (500) en vez de un 400.
export const esquemaId = z.uuid('Identificador no válido.');

export type DatosSala = z.infer<typeof esquemaSala>;
export type DatosEquipo = z.infer<typeof esquemaEquipo>;
export type DatosEstadoEquipo = z.infer<typeof esquemaEstadoEquipo>;
export type DatosIncidencia = z.infer<typeof esquemaIncidencia>;
export type FiltrosEquipos = z.infer<typeof esquemaFiltrosEquipos>;
export type FiltrosIncidencias = z.infer<typeof esquemaFiltrosIncidencias>;
export type DatosTecnico = z.infer<typeof esquemaTecnico>;
export type DatosAsignar = z.infer<typeof esquemaAsignar>;
