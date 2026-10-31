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
};

export type DetalleEquipo = { equipo: FilaEquipo; historial: FilaIncidencia[] };

export type ResultadoIncidencia = { incidencia: FilaIncidencia; estadoEquipo: EstadoEquipo };

export type FilaCandidato = { codigo: string; sala: string; incidencias30d: number };

export type FilaTecnico = { id: string; nombre: string; activo: boolean; enRevision: number };
