import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioReporte, type CasoPendiente } from '@/components/soporte/FormularioReporte';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { esSoporte } from '@/lib/auth/permisos';
import { obtenerSesion } from '@/lib/auth/sesion';
import { incidenciasPendientes, listarEquipos, listarSalas } from '@/lib/dataService';
import { normalizarCodigo } from '@/lib/reglas/equipo';

export const metadata: Metadata = { title: 'Reportar una falla' };

type Props = { searchParams: Promise<{ equipo?: string | string[] }> };

// Inicio de las cuentas de reporte (y atajo para soporte). ?equipo= llega desde el QR del equipo.
export default async function PaginaReportar({ searchParams }: Props) {
  const parametros = await searchParams;
  const [sesion, salas, equipos, pendientes] = await Promise.all([
    obtenerSesion(),
    listarSalas(),
    listarEquipos(),
    incidenciasPendientes(500),
  ]);
  const pedido = typeof parametros.equipo === 'string' ? normalizarCodigo(parametros.equipo) : null;

  // Casos sin cerrar por equipo: se muestran al elegirlo para no reportar dos veces lo mismo.
  const porEquipo: Record<string, CasoPendiente[]> = {};
  for (const caso of pendientes.filas) {
    (porEquipo[caso.equipoCodigo] ??= []).push({
      numeroCaso: caso.numeroCaso,
      descripcion: caso.descripcion,
      estado: caso.estado,
    });
  }

  return (
    <>
      <EncabezadoPagina
        etiqueta={sesion && esSoporte(sesion.rol) ? 'Reporte rápido' : 'Cuenta de reporte'}
        titulo="Reportar una falla"
        descripcion={
          <>
            Cuéntenos qué equipo falla y qué le pasa. Soporte recibe el caso al instante y usted puede seguirlo en{' '}
            <Link href="/soporte/mis-reportes" className="font-medium text-primario underline-offset-4 hover:underline">
              Mis reportes
            </Link>
            .
          </>
        }
      />
      {pedido && !equipos.some((e) => e.codigo === pedido) ? (
        <p className="rounded-lg border border-reparacion/30 bg-reparacion/10 px-4 py-3 text-sm text-reparacion">
          No encontramos el equipo &quot;{pedido}&quot;. Elíjalo en la lista.
        </p>
      ) : null}
      {salas.length ? (
        <div className="max-w-3xl">
          <FormularioReporte
            salas={salas.map(({ id, nombre }) => ({ id, nombre }))}
            equipos={equipos.map(({ codigo, salaId, sala, estado }) => ({ codigo, salaId, sala, estado }))}
            pendientes={porEquipo}
            equipoInicial={pedido}
            soporte={Boolean(sesion && esSoporte(sesion.rol))}
          />
        </div>
      ) : (
        <EstadoVacio titulo="Todavía no hay salas registradas">
          Cuando soporte registre las salas y sus equipos, podrá reportar fallas aquí.
        </EstadoVacio>
      )}
    </>
  );
}
