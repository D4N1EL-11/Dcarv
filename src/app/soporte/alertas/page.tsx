import type { Metadata } from 'next';
import Link from 'next/link';
import { MarcarAlertasVistas } from '@/components/soporte/MarcarAlertasVistas';
import { PanelAlertas, PanelObservacion } from '@/components/soporte/PanelAlertas';
import { BloquePanel, EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { Insignia } from '@/components/ui/Insignia';
import { ANIOS_OBSOLESCENCIA, DIAS_AVISO_GARANTIA, DIAS_VENTANA_ALERTA, INCIDENCIAS_PARA_ALERTA } from '@/lib/config/soporte';
import { candidatosDeLaPeticion } from '@/lib/consultasDePagina';
import { avisosDeHojaDeVida, listarEnObservacion, type AvisoEquipo } from '@/lib/dataService';
import { formatearFecha, plural } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';
import { antiguedadAnios, estadoGarantia, ETIQUETA_GARANTIA } from '@/lib/reglas/hojaDeVida';

function ListaEquipos({ equipos, detalle, vacio }: { equipos: AvisoEquipo[]; detalle: (e: AvisoEquipo) => React.ReactNode; vacio: string }) {
  if (!equipos.length) return <p className="text-sm text-texto-suave">{vacio}</p>;
  return (
    <ul className="divide-y divide-borde text-sm">
      {equipos.slice(0, 15).map((e) => (
        <li key={e.codigo} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0">
          <Link href={`/soporte/equipos/${encodeURIComponent(e.codigo)}`} className="font-medium text-primario underline-offset-4 hover:underline">
            {e.codigo} <span className="font-normal text-texto-suave">· {e.sala}</span>
          </Link>
          <span className="flex items-center gap-2 text-texto-suave">{detalle(e)}</span>
        </li>
      ))}
    </ul>
  );
}
import { soloSoporte } from '@/lib/auth/sesion';

export const metadata: Metadata = { title: 'Alertas' };

export default async function PaginaAlertas() {
  await soloSoporte();
  // Misma consulta que el contador del menú: React cache la ejecuta una sola vez por petición.
  const hoy = hoyBogota();
  const [candidatos, enObservacion, vida] = await Promise.all([
    candidatosDeLaPeticion(),
    listarEnObservacion(),
    avisosDeHojaDeVida(hoy),
  ]);
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

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BloquePanel titulo={`Garantías por vencer · próximos ${DIAS_AVISO_GARANTIA} días`}>
          <ListaEquipos
            equipos={vida.garantias}
            vacio="Ninguna garantía vence pronto (según las fichas técnicas registradas)."
            detalle={(e) => {
              const estado = estadoGarantia(e.garantiaHasta, hoy);
              return (
                <>
                  {e.garantiaHasta ? formatearFecha(e.garantiaHasta) : ''}
                  <Insignia tono={estado === 'vencida' ? 'baja' : 'reparacion'} texto={ETIQUETA_GARANTIA[estado]} />
                </>
              );
            }}
          />
        </BloquePanel>
        <BloquePanel titulo={`Para renovar · ${ANIOS_OBSOLESCENCIA} años o más de uso`}>
          <ListaEquipos
            equipos={vida.obsoletos}
            vacio="Ningún equipo en servicio supera la vida útil (según las fichas técnicas registradas)."
            detalle={(e) => `${antiguedadAnios(e.fechaCompra, hoy)} años · comprado el ${e.fechaCompra ? formatearFecha(e.fechaCompra) : '—'}`}
          />
        </BloquePanel>
      </div>

      {/* Abrir esta página deja las alertas como vistas: el número del menú desaparece. */}
      <MarcarAlertasVistas codigos={candidatos.map((c) => c.codigo)} />
    </>
  );
}
