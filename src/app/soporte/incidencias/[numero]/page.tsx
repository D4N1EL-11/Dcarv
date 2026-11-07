import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AccionesIncidencia } from '@/components/soporte/AccionesIncidencia';
import { ClasificarIncidencia } from '@/components/soporte/ClasificarIncidencia';
import { ConversacionCaso } from '@/components/soporte/ConversacionCaso';
import { InsigniaEstadoEquipo } from '@/components/soporte/InsigniaEstadoEquipo';
import { InsigniaEstadoIncidencia } from '@/components/soporte/InsigniaEstadoIncidencia';
import { EtiquetaCategoria, InsigniaPrioridad } from '@/components/soporte/InsigniasClasificacion';
import { InsigniaSla } from '@/components/soporte/InsigniaSla';
import { UsarRepuesto } from '@/components/soporte/UsarRepuesto';
import { ListaEventos } from '@/components/soporte/ListaEventos';
import { MigaDePan } from '@/components/soporte/MigaDePan';
import { BotonImprimir } from '@/components/ui/BotonImprimir';
import { BloquePanel, EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { esSoporte } from '@/lib/auth/permisos';
import { obtenerSesion } from '@/lib/auth/sesion';
import { tecnicosDeLaPeticion } from '@/lib/consultasDePagina';
import {
  eventosDeCaso,
  listarComentarios,
  listarRepuestos,
  obtenerIncidencia,
  repuestosDeCaso,
  rolActual,
} from '@/lib/dataService';
import { formatearFecha, plural, textoAntiguedad, textoResolucion } from '@/lib/formato';
import { motivoSinComentarios } from '@/lib/reglas/comentario';
import { diasEntre, hoyBogota } from '@/lib/reglas/fechas';
import { esquemaNumeroCaso } from '@/lib/validacion/esquemas';

type Props = { params: Promise<{ numero: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const numero = esquemaNumeroCaso.safeParse(decodeURIComponent((await params).numero));
  return { title: numero.success ? numero.data : 'Caso' };
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-texto-suave">{titulo}</dt>
      <dd className="text-sm text-texto">{children}</dd>
    </div>
  );
}

const formatoMomento = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' });

// Ficha de un caso: todo lo que se sabe de una incidencia y la conversación con quien la reportó.
// Soporte abre cualquiera; una cuenta de reporte, solo las suyas (las ajenas responden 404, igual
// que un número inexistente, para no revelar qué casos hay).
export default async function FichaDelCaso({ params }: Props) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  const numero = esquemaNumeroCaso.safeParse(decodeURIComponent((await params).numero));
  if (!numero.success) notFound();

  // El rol se lee de la base: quitarle soporte a una cuenta surte efecto aquí de inmediato.
  const [caso, rol] = await Promise.all([obtenerIncidencia(numero.data), rolActual(sesion.id)]);
  if (!caso || !rol) notFound();
  const soporte = esSoporte(rol);
  if (!soporte && caso.reportadoPorId !== sesion.id) notFound();

  const [comentarios, eventos, tecnicos, usados, bodega] = await Promise.all([
    listarComentarios(caso.numeroCaso),
    soporte ? eventosDeCaso(caso.numeroCaso) : Promise.resolve([]),
    soporte ? tecnicosDeLaPeticion() : Promise.resolve([]),
    soporte ? repuestosDeCaso(caso.numeroCaso) : Promise.resolve([]),
    soporte && caso.estado !== 'cerrada' ? listarRepuestos() : Promise.resolve([]),
  ]);
  const hoy = hoyBogota();
  const quien = { soporte, esQuienReporto: caso.reportadoPorId === sesion.id };
  const cerrada = caso.estado === 'cerrada';

  return (
    <>
      <div className="print:hidden">
        <MigaDePan
          pasos={
            soporte
              ? [
                  { texto: 'Incidencias', href: '/soporte/incidencias' },
                  { texto: caso.equipoCodigo, href: `/soporte/equipos/${encodeURIComponent(caso.equipoCodigo)}` },
                  { texto: caso.numeroCaso },
                ]
              : [{ texto: 'Mis reportes', href: '/soporte/mis-reportes' }, { texto: caso.numeroCaso }]
          }
        />
      </div>

      <EncabezadoPagina
        etiqueta={`Caso de ${caso.equipoCodigo} · ${caso.sala}`}
        titulo={caso.numeroCaso}
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            <InsigniaEstadoIncidencia estado={caso.estado} />
            <InsigniaPrioridad prioridad={caso.prioridad} />
            <EtiquetaCategoria categoria={caso.categoria} />
            {soporte ? <InsigniaSla caso={caso} /> : null}
          </span>
        }
      >
        <BotonImprimir texto="Imprimir caso" />
      </EncabezadoPagina>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid content-start gap-6">
          <Tarjeta className="grid gap-4">
            <h2 className="text-2xl font-medium">La falla</h2>
            <p className="whitespace-pre-line break-words text-texto">{caso.descripcion}</p>
            {caso.tieneFoto ? (
              <a
                href={`/api/soporte/incidencias/${encodeURIComponent(caso.numeroCaso)}/foto`}
                target="_blank"
                rel="noreferrer"
                className="group block w-fit"
                title="Abrir la foto en tamaño completo"
              >
                <img
                  src={`/api/soporte/incidencias/${encodeURIComponent(caso.numeroCaso)}/foto`}
                  alt={`Foto de la falla del caso ${caso.numeroCaso}`}
                  className="max-h-80 rounded-xl border border-borde object-contain transition group-hover:border-primario/60"
                />
              </a>
            ) : null}
            <p className="text-xs text-texto-suave">
              Reportada el {formatoMomento.format(new Date(caso.creadaEn))}
              {caso.reportadoPor ? ` por ${caso.reportadoPorId === sesion.id ? 'usted' : caso.reportadoPor}` : ''}.
            </p>
          </Tarjeta>

          <section id="conversacion" aria-labelledby="titulo-conversacion" className="grid scroll-mt-24 gap-4">
            <TituloSeccion id="titulo-conversacion" titulo="Conversación">
              <span className="text-sm text-texto-suave">
                {comentarios.length ? plural(comentarios.length, 'comentario', 'comentarios') : 'Soporte y quien reportó'}
              </span>
            </TituloSeccion>
            <ConversacionCaso
              numeroCaso={caso.numeroCaso}
              comentarios={comentarios}
              miEmail={sesion.email}
              soporte={soporte}
              motivoSinEscribir={motivoSinComentarios(quien, caso.estado)}
            />
          </section>

          {soporte ? (
            <section aria-labelledby="titulo-recorrido" className="grid gap-4">
              <TituloSeccion id="titulo-recorrido" titulo="Recorrido del caso">
                <span className="text-sm text-texto-suave">Del registro de cambios, del primero al último</span>
              </TituloSeccion>
              <ListaEventos eventos={eventos} mostrarEnlaces={false} />
            </section>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          <BloquePanel titulo="Detalles">
            <dl className="grid gap-4">
              <Dato titulo="Equipo">
                {soporte ? (
                  <Link
                    href={`/soporte/equipos/${encodeURIComponent(caso.equipoCodigo)}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primario underline-offset-4 hover:underline"
                  >
                    <Icono nombre="equipo" className="size-3.5" /> {caso.equipoCodigo}
                  </Link>
                ) : (
                  <span className="font-medium">{caso.equipoCodigo}</span>
                )}{' '}
                <span className="text-texto-suave">· {caso.sala}</span>
              </Dato>
              <Dato titulo="Estado del equipo">
                <InsigniaEstadoEquipo estado={caso.estadoEquipo} />
              </Dato>
              <Dato titulo="Fecha del reporte">
                {formatearFecha(caso.fecha)}
                {!cerrada ? <span className="text-texto-suave"> · {textoAntiguedad(diasEntre(caso.fecha, hoy))}</span> : null}
              </Dato>
              {cerrada ? (
                <Dato titulo="Cierre">
                  {formatearFecha(caso.diaEstado)} ·{' '}
                  <span className="text-funcional">{textoResolucion(diasEntre(caso.fecha, caso.diaEstado))}</span>
                </Dato>
              ) : null}
              <Dato titulo="Técnico">{caso.tecnico ?? <span className="italic text-texto-suave">Sin asignar</span>}</Dato>
              {soporte && caso.reportadoPor ? <Dato titulo="Reportó">{caso.reportadoPor}</Dato> : null}
              {soporte && caso.otrasPendientes ? (
                <Dato titulo="Otros casos del equipo">
                  <Link
                    href={`/soporte/incidencias?equipoCodigo=${encodeURIComponent(caso.equipoCodigo)}`}
                    className="text-primario underline-offset-4 hover:underline"
                  >
                    {plural(caso.otrasPendientes, 'pendiente', 'pendientes')}
                  </Link>
                </Dato>
              ) : null}
            </dl>
          </BloquePanel>

          {soporte ? (
            <>
              {!cerrada ? (
                <BloquePanel titulo="Atender" className="print:hidden">
                  <AccionesIncidencia
                    numeroCaso={caso.numeroCaso}
                    estado={caso.estado}
                    equipoCodigo={caso.equipoCodigo}
                    estadoEquipo={caso.estadoEquipo}
                    otrasPendientes={caso.otrasPendientes}
                    tecnicos={tecnicos.filter((t) => t.activo).map(({ id, nombre }) => ({ id, nombre }))}
                  />
                </BloquePanel>
              ) : null}
              <BloquePanel titulo="Clasificación" className="print:hidden">
                <ClasificarIncidencia numeroCaso={caso.numeroCaso} categoria={caso.categoria} prioridad={caso.prioridad} />
              </BloquePanel>
              <BloquePanel titulo={usados.length ? `Repuestos usados · ${usados.length}` : 'Repuestos usados'}>
                {usados.length ? (
                  <ul className="grid gap-2 text-sm">
                    {usados.map((u) => (
                      <li key={u.id} className="flex items-baseline justify-between gap-3">
                        <span className="text-texto">{u.nombre}</span>
                        <span className="shrink-0 tabular-nums text-texto-suave">× {u.cantidad}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-texto-suave">Ninguno anotado.</p>
                )}
                {!cerrada ? (
                  <div className="border-t border-borde pt-4 print:hidden">
                    <UsarRepuesto
                      numeroCaso={caso.numeroCaso}
                      repuestos={bodega.map(({ id, nombre, existencias }) => ({ id, nombre, existencias }))}
                    />
                  </div>
                ) : null}
              </BloquePanel>
            </>
          ) : (
            <BloquePanel titulo="¿Qué significa el estado?">
              <p className="text-sm text-texto-suave">
                <strong className="text-texto">Abierta:</strong> soporte aún no lo toma.{' '}
                <strong className="text-texto">En revisión:</strong> un técnico lo atiende.{' '}
                <strong className="text-texto">Cerrada:</strong> ya se resolvió.
              </p>
            </BloquePanel>
          )}
        </aside>
      </div>
    </>
  );
}
