import type { Metadata } from 'next';
import { PanelAlertas } from '@/components/soporte/PanelAlertas';
import { DIAS_VENTANA_ALERTA, INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';

export const metadata: Metadata = { title: 'Alertas' };

export default async function PaginaAlertas() {
  // Misma consulta que el contador del menú: React cache la ejecuta una sola vez por petición.
  const candidatos = await candidatosDeLaPeticion();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Alertas de candidatos a baja</h1>
        <p className="text-sm text-texto-suave">
          Equipos en servicio con {INCIDENCIAS_PARA_ALERTA} o más incidencias en los últimos{' '}
          {DIAS_VENTANA_ALERTA} días, del más crítico al menos crítico. Puede revisar su historial
          o darlos de baja aquí mismo.
        </p>
      </div>
      <PanelAlertas candidatos={candidatos} />
    </>
  );
}
