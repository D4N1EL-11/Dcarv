import type { Metadata } from 'next';
import Link from 'next/link';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { ESTADOS_INCIDENCIA } from '@/lib/config/soporte';
import {
  contarIncidenciasPorEstado,
  listarIncidencias,
  listarTecnicos,
  type ConteoIncidencias,
} from '@/lib/dataService';
import { etiquetaEstadoIncidencia, plural } from '@/lib/formato';
import type { EstadoIncidencia } from '@/lib/reglas/incidencia';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

export const metadata: Metadata = { title: 'Incidencias' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function enlace(estado: string, equipoCodigo: string): string {
  const consulta = new URLSearchParams();
  if (estado) consulta.set('estado', estado);
  if (equipoCodigo) consulta.set('equipoCodigo', equipoCodigo);
  const texto = consulta.toString();
  return texto ? `/soporte/incidencias?${texto}` : '/soporte/incidencias';
}

function Pestanas({
  estado,
  equipoCodigo,
  conteo,
}: {
  estado: EstadoIncidencia | undefined;
  equipoCodigo: string;
  conteo: ConteoIncidencias;
}) {
  const total = conteo.abierta + conteo.en_revision + conteo.cerrada;
  const pestanas = [
    { valor: '', texto: 'Todas', cantidad: total },
    ...ESTADOS_INCIDENCIA.map((valor) => ({
      valor,
      texto: etiquetaEstadoIncidencia(valor),
      cantidad: conteo[valor],
    })),
  ];
  return (
    <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {pestanas.map(({ valor, texto, cantidad }) => {
        const activa = (estado ?? '') === valor;
        return (
          <Link
            key={valor || 'todas'}
            href={enlace(valor, equipoCodigo)}
            aria-current={activa ? 'page' : undefined}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-primario ${activa ? 'border-primario bg-primario text-white' : 'border-borde bg-superficie text-texto hover:bg-primario-suave'}`}
          >
            {texto} <span className={activa ? 'text-white/85' : 'text-texto-suave'}>({cantidad})</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default async function PaginaIncidencias({ searchParams }: Props) {
  const filtrado = esquemaFiltrosIncidencias.safeParse(await searchParams);
  const filtros = filtrado.success ? filtrado.data : {};
  const equipoCodigo = filtros.equipoCodigo ?? '';
  const [incidencias, tecnicos, conteo] = await Promise.all([
    listarIncidencias(filtros),
    listarTecnicos(),
    contarIncidenciasPorEstado(),
  ]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Incidencias</h1>
        <p className="text-sm text-texto-suave">
          Todas las incidencias reportadas, de la más reciente a la más antigua.
        </p>
      </div>

      <Pestanas estado={filtros.estado} equipoCodigo={equipoCodigo} conteo={conteo} />

      <form
        method="get"
        action="/soporte/incidencias"
        className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        {filtros.estado ? <input type="hidden" name="estado" value={filtros.estado} /> : null}
        <Campo
          etiqueta="Código del equipo"
          name="equipoCodigo"
          type="search"
          placeholder="Ej.: PC-SALA1-01"
          defaultValue={equipoCodigo}
          maxLength={40}
        />
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
        {equipoCodigo ? (
          <Link
            href={enlace(filtros.estado ?? '', '')}
            className="self-center text-sm font-semibold text-primario underline"
          >
            Quitar filtro de equipo
          </Link>
        ) : null}
      </form>

      <p role="status" className="text-sm text-texto-suave">
        {plural(incidencias.length, 'incidencia', 'incidencias')}
        {filtros.estado ? ` en estado "${etiquetaEstadoIncidencia(filtros.estado)}"` : ''}
        {equipoCodigo ? ` del equipo ${equipoCodigo}` : ''}
      </p>

      <HistorialIncidencias
        incidencias={incidencias}
        tecnicos={tecnicos}
        mostrarEquipo
        textoVacio="No hay incidencias para mostrar"
      />
    </>
  );
}
