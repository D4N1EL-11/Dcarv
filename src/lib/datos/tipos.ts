import type { EstadoEquipo } from '@/lib/reglas/equipo';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';

export type { EstadoEquipo, EstadoIncidencia };

export type FilaSala = {
  id: string;
  nombre: string;
  totalEquipos: number;
  funcionales: number;
  enReparacion: number;
  dadosDeBaja: number;
};

export type FilaEquipo = {
  codigo: string;
  salaId: string;
  sala: string;
  estado: EstadoEquipo;
  incidencias30d: number;
};

export type FilaIncidencia = {
  numeroCaso: string;
  equipoCodigo: string;
  descripcion: string;
  estado: EstadoIncidencia;
  fecha: string;
  tecnico: string | null;
  tecnicoId: string | null;
  // Día (en Bogotá) del último cambio de estado o de técnico: base de la reasignación (RN-10).
  diaEstado: string;
  estadoEquipo: EstadoEquipo;
  // Incidencias no cerradas del mismo equipo, sin contar esta.
  otrasPendientes: number;
};

export type DetalleEquipo = { equipo: FilaEquipo; historial: FilaIncidencia[] };

export type ResultadoIncidencia = { incidencia: FilaIncidencia; estadoEquipo: EstadoEquipo };

export type FilaCandidato = {
  codigo: string;
  sala: string;
  estado: EstadoEquipo;
  incidencias30d: number;
  ultimaFecha: string;
  pendientes: number;
};

export type ConteoIncidencias = Record<EstadoIncidencia, number>;

export type FilaTecnico = {
  id: string;
  nombre: string;
  activo: boolean;
  enRevision: number;
  cerradas: number;
};

export type Pagina<T> = { filas: T[]; total: number; pagina: number; paginas: number; tamano: number };

export type ResultadoCierre = { estadoEquipo: EstadoEquipo; equipoReactivado: boolean };

export type ResultadoActividad = { activo: boolean; reasignadas: number; sinReasignar: number };
