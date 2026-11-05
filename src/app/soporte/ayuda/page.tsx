import type { Metadata } from 'next';
import Link from 'next/link';
import { InsigniaEstadoEquipo } from '@/components/soporte/InsigniaEstadoEquipo';
import { InsigniaEstadoIncidencia } from '@/components/soporte/InsigniaEstadoIncidencia';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { Tarjeta } from '@/components/ui/Tarjeta';
import {
  DIAS_REASIGNACION,
  DIAS_VENTANA_ALERTA,
  INCIDENCIAS_PARA_ALERTA,
  MAXIMO_LOTE_EQUIPOS,
  TAMANO_PAGINA_EQUIPOS,
  TAMANO_PAGINA_INCIDENCIAS,
} from '@/lib/config/soporte';

export const metadata: Metadata = { title: 'Ayuda y reglas' };

// Las cifras salen de lib/config/soporte.ts: si una regla cambia, esta página cambia con ella.
const REGLAS: { id: string; texto: string }[] = [
  { id: 'RN-01', texto: 'El código del equipo es único e identifica al equipo (por ejemplo, PC-SALA1-03).' },
  { id: 'RN-02', texto: 'Un equipo nuevo nace con estado funcional.' },
  { id: 'RN-04', texto: 'La incidencia nace abierta, con la fecha de hoy en Colombia asignada por el sistema.' },
  { id: 'RN-05', texto: 'Cada incidencia recibe un número de caso legible y consecutivo: INC-0001, INC-0002…' },
  { id: 'RN-06', texto: 'Reportar una incidencia pone el equipo en reparación, salvo que esté dado de baja.' },
  { id: 'RN-07', texto: 'El estado del equipo se puede cambiar a cualquiera de los tres en cualquier momento.' },
  { id: 'RN-08', texto: 'Se puede reportar otra incidencia sobre un equipo que ya tiene una abierta.' },
  {
    id: 'RN-09',
    texto: `Un equipo es candidato a baja si acumula ${INCIDENCIAS_PARA_ALERTA} o más incidencias en los últimos ${DIAS_VENTANA_ALERTA} días.`,
  },
  {
    id: 'RN-10',
    texto: `Una incidencia con más de ${DIAS_REASIGNACION} días en revisión sin cambios pasa sola al técnico activo con menos casos (revisión diaria automática).`,
  },
  { id: 'RN-11', texto: 'Solo se asigna un técnico a una incidencia abierta; al asignarlo pasa a "en revisión".' },
  { id: 'RN-14', texto: 'El historial de un equipo va de la incidencia más reciente a la más antigua.' },
  { id: 'RN-15', texto: 'Un equipo no se elimina: "dado de baja" lo retira de servicio y conserva su historial.' },
];

const ATAJOS = [
  { teclas: 'Ctrl K', accion: 'Abrir la búsqueda global (también con "/")' },
  { teclas: '↑ ↓ · Enter', accion: 'Moverse por los resultados y abrir uno' },
  { teclas: 'Esc', accion: 'Cerrar la búsqueda o un diálogo' },
  { teclas: '← →', accion: 'Recorrer los días del gráfico de actividad (con el gráfico enfocado)' },
];

const PREGUNTAS = [
  {
    pregunta: '¿Cómo registro todo el inventario de una sala?',
    respuesta: `En "Registrar equipo", use "Varios equipos a la vez": un prefijo y un rango generan hasta ${MAXIMO_LOTE_EQUIPOS} códigos consecutivos. Los repetidos se informan y se saltan.`,
  },
  {
    pregunta: 'Cerré una incidencia y el equipo sigue "en reparación". ¿Por qué?',
    respuesta:
      'El sistema solo cambia el estado del equipo de forma automática al reportar (RN-06). Al cerrar la última incidencia pendiente se ofrece una casilla para dejarlo funcional en el mismo paso.',
  },
  {
    pregunta: '¿Qué cuenta el número rojo junto a "Alertas"?',
    respuesta:
      'Solo los candidatos a baja nuevos. Al abrir Alertas quedan como vistos y el número desaparece; también baja solo cuando un equipo deja de ser candidato (por ejemplo, al darlo de baja). Si aparece un candidato nuevo, vuelve a mostrarse.',
  },
  {
    pregunta: '¿Qué pasa si desactivo a un técnico?',
    respuesta: 'Deja de recibir casos. Sus incidencias en revisión pasan, en el mismo momento, al técnico activo con menos carga.',
  },
  {
    pregunta: '¿Puedo llevar los datos a Excel?',
    respuesta: `Sí: "Exportar CSV" en el Panel (equipos) y en Incidencias respeta los filtros aplicados. Las listas en pantalla se muestran de a ${TAMANO_PAGINA_EQUIPOS} equipos y ${TAMANO_PAGINA_INCIDENCIAS} incidencias por página.`,
  },
  {
    pregunta: '¿Se puede imprimir la hoja de vida de un equipo?',
    respuesta: 'Sí: en la ficha del equipo, "Imprimir ficha" genera una versión en blanco y negro sin menús, lista para imprimir o guardar como PDF.',
  },
];

export default function PaginaAyuda() {
  return (
    <>
      <EncabezadoPagina
        etiqueta="Guía de uso"
        titulo="Ayuda y reglas"
        descripcion="Cómo funciona Soporte de Salas, qué significa cada estado y qué reglas aplica el sistema por su cuenta."
      />

      <section aria-labelledby="flujo" className="grid gap-5">
        <TituloSeccion id="flujo" titulo="El flujo en cuatro pasos" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Registrar', 'Cree las salas y su inventario de equipos.', '/soporte/salas'],
            ['Reportar', 'Desde la ficha del equipo, describa la falla.', '/soporte'],
            ['Atender', 'Asigne un técnico y siga el caso hasta cerrarlo.', '/soporte/incidencias'],
            ['Decidir', 'Revise las alertas y dé de baja lo que ya no sirve.', '/soporte/alertas'],
          ].map(([titulo, texto, href], indice) => (
            <li key={titulo}>
              <Link href={href!} className="grid h-full gap-2 rounded-xl border border-borde bg-superficie p-5 transition hover:border-primario/50">
                <span className="font-titulo text-3xl text-primario">{indice + 1}</span>
                <span className="font-medium">{titulo}</span>
                <span className="text-sm text-texto-suave">{texto}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="estados" className="grid gap-5">
        <TituloSeccion id="estados" titulo="Estados" />
        <div className="grid gap-4 md:grid-cols-2">
          <Tarjeta className="grid gap-3">
            <h3 className="text-lg font-medium">Del equipo</h3>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center gap-3"><dt><InsigniaEstadoEquipo estado="funcional" /></dt><dd className="text-texto-suave">Disponible para uso.</dd></div>
              <div className="flex items-center gap-3"><dt><InsigniaEstadoEquipo estado="en_reparacion" /></dt><dd className="text-texto-suave">Tiene una falla en atención.</dd></div>
              <div className="flex items-center gap-3"><dt><InsigniaEstadoEquipo estado="dado_de_baja" /></dt><dd className="text-texto-suave">Retirado de servicio; conserva su historial.</dd></div>
            </dl>
          </Tarjeta>
          <Tarjeta className="grid gap-3">
            <h3 className="text-lg font-medium">De la incidencia</h3>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center gap-3"><dt><InsigniaEstadoIncidencia estado="abierta" /></dt><dd className="text-texto-suave">Reportada, sin atender.</dd></div>
              <div className="flex items-center gap-3"><dt><InsigniaEstadoIncidencia estado="en_revision" /></dt><dd className="text-texto-suave">Asignada a un técnico.</dd></div>
              <div className="flex items-center gap-3"><dt><InsigniaEstadoIncidencia estado="cerrada" /></dt><dd className="text-texto-suave">Resuelta; no se reabre.</dd></div>
            </dl>
          </Tarjeta>
        </div>
      </section>

      <section aria-labelledby="reglas" className="grid gap-5">
        <TituloSeccion id="reglas" titulo="Reglas que aplica el sistema" />
        <ul className="grid gap-2 md:grid-cols-2">
          {REGLAS.map((regla) => (
            <li key={regla.id} className="flex gap-3 rounded-lg border border-borde bg-superficie px-4 py-3 text-sm">
              <span className="shrink-0 font-mono text-xs text-primario">{regla.id}</span>
              <span>{regla.texto}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="atajos" className="grid content-start gap-5">
          <TituloSeccion id="atajos" titulo="Atajos de teclado" />
          <table className="w-full text-sm">
            <tbody>
              {ATAJOS.map((atajo) => (
                <tr key={atajo.teclas} className="border-b border-borde">
                  <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                    <kbd className="whitespace-nowrap rounded border border-borde bg-superficie px-2 py-0.5 text-xs">{atajo.teclas}</kbd>
                  </th>
                  <td className="py-2.5 text-texto-suave">{atajo.accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="preguntas" className="grid content-start gap-5">
          <TituloSeccion id="preguntas" titulo="Preguntas frecuentes" />
          <div className="grid gap-2">
            {PREGUNTAS.map((p) => (
              <details key={p.pregunta} className="group rounded-lg border border-borde bg-superficie px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium marker:text-primario">{p.pregunta}</summary>
                <p className="mt-2 text-sm text-texto-suave">{p.respuesta}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
