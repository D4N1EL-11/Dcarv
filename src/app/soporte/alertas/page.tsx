import type { Metadata } from 'next';
import { MarcarAlertasVistas } from '@/components/soporte/MarcarAlertasVistas';
import { PanelAlertas, PanelObservacion } from '@/components/soporte/PanelAlertas';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { DIAS_VENTANA_ALERTA, INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import { listarEnObservacion } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { soloSoporte } from '@/lib/auth/sesion';

export const metadata: Metadata = { title: 'Alertas' };

export default async function PaginaAlertas() {
  await soloSoporte();
  // Misma consulta que el contador del menú: React cache la ejecuta una sola vez por petición.
  const [candidatos, enObservacion] = await Promise.all([candidatosDeLaPeticion(), listarEnObservacion()]);
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

      <section aria-labelledby="titulo-observacion" className="grid gap-5">
        <TituloSeccion id="titulo-observacion" titulo="En observación">
          <p className="text-sm text-texto-suave">
            Con {INCIDENCIAS_PARA_ALERTA - 1} fallas en {DIAS_VENTANA_ALERTA} días: una más y pasan a candidatos.
          </p>
        </TituloSeccion>
        <PanelObservacion equipos={enObservacion} />
      </section>

      {/* Abrir esta página deja las alertas como vistas: el número del menú desaparece. */}
      <MarcarAlertasVistas codigos={candidatos.map((c) => c.codigo)} />
    </>
  );
}
