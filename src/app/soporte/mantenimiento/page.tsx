import type { Metadata } from 'next';
import Link from 'next/link';
import { AccionesMantenimiento } from '@/components/soporte/AccionesMantenimiento';
import { clasesBoton } from '@/components/ui/Boton';
import { Cifra } from '@/components/ui/Cifra';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia, type TonoInsignia } from '@/components/ui/Insignia';
import { soloSoporte } from '@/lib/auth/sesion';
import { DIAS_AVISO_MANTENIMIENTO } from '@/lib/config/soporte';
import { contarMantenimientoPorEstado, historialMantenimientos, planDeMantenimiento } from '@/lib/dataService';
import { formatearFecha, plural } from '@/lib/formato';
import { hoyBogota } from '@/lib/reglas/fechas';
import { ETIQUETA_MANTENIMIENTO, textoVencimiento, type EstadoMantenimiento } from '@/lib/reglas/mantenimiento';

export const metadata: Metadata = { title: 'Mantenimiento preventivo' };

const TONO: Record<EstadoMantenimiento, TonoInsignia> = {
  vencido: 'baja',
  proximo: 'reparacion',
  al_dia: 'funcional',
  sin_plan: 'neutro',
};

// Mantenimiento preventivo por sala: cada cuánto se revisa, cuándo fue la última vez y qué sala
// está vencida. Lo vencido aparece primero.
export default async function PaginaMantenimiento() {
  await soloSoporte();
  const hoy = hoyBogota();
  const [plan, historial] = await Promise.all([planDeMantenimiento(hoy), historialMantenimientos({}, 15)]);
  const conteo = contarMantenimientoPorEstado(plan);

  return (
    <>
      <EncabezadoPagina
        etiqueta="Prevención"
        titulo="Mantenimiento preventivo"
        descripcion={`Programe cada cuánto se revisa cada sala y registre cada revisión hecha. Una sala aparece como "Próximo" cuando le faltan ${DIAS_AVISO_MANTENIMIENTO} días o menos, y como "Vencido" cuando pasó la fecha.`}
      />

      {!plan.length ? (
        <EstadoVacio titulo="Todavía no hay salas registradas" icono="salas">
          <Link href="/soporte/salas" className={`${clasesBoton()} mt-4`}>
            Registrar una sala
          </Link>
        </EstadoVacio>
      ) : (
        <>
          <section aria-label="Resumen" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Cifra titulo="Vencidos" valor={conteo.vencido} detalle="ya pasó la fecha" icono="alertas" color="text-baja" />
            <Cifra
              titulo="Próximos"
              valor={conteo.proximo}
              detalle={`en ${DIAS_AVISO_MANTENIMIENTO} días o menos`}
              icono="calendario"
              color="text-reparacion"
            />
            <Cifra titulo="Al día" valor={conteo.al_dia} detalle="con la revisión vigente" icono="check" color="text-funcional" />
            <Cifra titulo="Sin plan" valor={conteo.sin_plan} detalle="salas sin frecuencia" icono="mantenimiento" color="text-texto-suave" />
          </section>

          <section aria-labelledby="titulo-salas" className="grid gap-4">
            <TituloSeccion id="titulo-salas" titulo="Salas">
              <span className="text-sm text-texto-suave">{plural(plan.length, 'sala', 'salas')}, lo vencido primero</span>
            </TituloSeccion>
            <ol className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
              {plan.map((sala) => (
                <li
                  key={sala.salaId}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="grid min-w-0 gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-texto">{sala.sala}</span>
                      <Insignia tono={TONO[sala.estado]} texto={ETIQUETA_MANTENIMIENTO[sala.estado]} />
                      <span className="text-xs text-texto-suave">{plural(sala.totalEquipos, 'equipo en servicio', 'equipos en servicio')}</span>
                    </div>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-suave">
                      <span>{sala.cadaDias ? `Cada ${plural(sala.cadaDias, 'día', 'días')}` : 'Sin frecuencia'}</span>
                      <span>Último: {sala.ultimo ? formatearFecha(sala.ultimo) : 'ninguno registrado'}</span>
                      {sala.proximo ? (
                        <span className={sala.estado === 'vencido' ? 'text-baja' : sala.estado === 'proximo' ? 'text-reparacion' : ''}>
                          Próximo: {formatearFecha(sala.proximo)} · {textoVencimiento(sala.proximo, hoy)}
                        </span>
                      ) : null}
                    </p>
                    {sala.ultimasNotas ? (
                      <p className="line-clamp-2 text-xs text-texto-suave" title={sala.ultimasNotas}>
                        “{sala.ultimasNotas}”
                      </p>
                    ) : null}
                  </div>
                  <AccionesMantenimiento salaId={sala.salaId} sala={sala.sala} cadaDias={sala.cadaDias} hoy={hoy} />
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="titulo-historial" className="grid gap-4">
            <TituloSeccion id="titulo-historial" titulo="Últimos mantenimientos">
              <Link href="/soporte/informe" className="text-sm font-medium text-primario underline-offset-4 hover:underline">
                Ver por mes en el informe
              </Link>
            </TituloSeccion>
            {historial.length ? (
              <ol className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie">
                {historial.map((m) => (
                  <li key={m.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                    <span className="text-sm tabular-nums text-texto-suave">{formatearFecha(m.fecha)}</span>
                    <span className="grid gap-0.5">
                      <span className="text-sm text-texto">
                        <strong className="font-semibold">{m.sala}</strong>
                        {m.notas ? ` · ${m.notas}` : ''}
                      </span>
                      <span className="text-xs text-texto-suave">Registró {m.registradoPor}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EstadoVacio titulo="Todavía no hay mantenimientos registrados" icono="mantenimiento">
                Use &quot;Registrar&quot; en una sala cuando termine una revisión.
              </EstadoVacio>
            )}
          </section>
        </>
      )}
    </>
  );
}
