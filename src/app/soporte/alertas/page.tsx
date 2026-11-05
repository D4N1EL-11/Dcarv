import type { Metadata } from 'next';
import { MarcarAlertasVistas } from '@/components/soporte/MarcarAlertasVistas';
import { PanelAlertas } from '@/components/soporte/PanelAlertas';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { DIAS_VENTANA_ALERTA, INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import { plural } from '@/lib/formato';

export const metadata: Metadata = { title: 'Alertas' };

export default async function PaginaAlertas() {
  // Misma consulta que el contador del menú: React cache la ejecuta una sola vez por petición.
  const candidatos = await candidatosDeLaPeticion();
  return (
    <>
      <EncabezadoPagina
        etiqueta={candidatos.length ? plural(candidatos.length, 'candidato a baja', 'candidatos a baja') : 'Sin alertas'}
        titulo="Alertas de candidatos a baja"
        descripcion={
          <>
            Equipos en servicio con {INCIDENCIAS_PARA_ALERTA} o más incidencias en los últimos{' '}
            {DIAS_VENTANA_ALERTA} días, del más crítico al menos crítico. Puede revisar su historial
            o darlos de baja aquí mismo.
          </>
        }
      />
      <PanelAlertas candidatos={candidatos} />
      {/* Abrir esta página deja las alertas como vistas: el número del menú desaparece. */}
      <MarcarAlertasVistas codigos={candidatos.map((c) => c.codigo)} />
    </>
  );
}
