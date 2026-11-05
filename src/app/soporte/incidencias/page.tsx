import type { Metadata } from 'next';
import Link from 'next/link';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { Boton, clasesBoton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Paginacion } from '@/components/ui/Paginacion';
import { Selector } from '@/components/ui/Selector';
import { ESTADOS_INCIDENCIA, TAMANO_PAGINA_INCIDENCIAS } from '@/lib/config/soporte';
import { tecnicosDeLaPeticion } from '@/lib/consultasDePagina';
import {
  contarIncidenciasPorEstado,
  paginarIncidencias,
  type ConteoIncidencias,
  type FiltrosIncidencias,
} from '@/lib/dataService';
import { etiquetaEstadoIncidencia, plural } from '@/lib/formato';
import { normalizarPagina } from '@/lib/reglas/paginacion';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

export const metadata: Metadata = { title: 'Incidencias' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Una sola función arma todas las URLs: los filtros que no se cambian se conservan, y cambiar
// cualquier filtro vuelve a la página 1.
function enlace(filtros: FiltrosIncidencias, cambios: Partial<FiltrosIncidencias> & { pagina?: number } = {}): string {
  const { pagina = 1, ...resto } = cambios;
  const valores = { ...filtros, ...resto };
  const consulta = new URLSearchParams();
  for (const nombre of ['estado', 'busqueda', 'equipoCodigo', 'tecnicoId'] as const) {
    const valor = valores[nombre];
    if (valor) consulta.set(nombre, valor);
  }
  if (pagina > 1) consulta.set('pagina', String(pagina));
  const texto = consulta.toString();
  return texto ? `/soporte/incidencias?${texto}` : '/soporte/incidencias';
}

function Pestanas({ filtros, conteo }: { filtros: FiltrosIncidencias; conteo: ConteoIncidencias }) {
  const total = conteo.abierta + conteo.en_revision + conteo.cerrada;
  const pestanas = [
    { valor: undefined, texto: 'Todas', cantidad: total },
    ...ESTADOS_INCIDENCIA.map((valor) => ({
      valor,
      texto: etiquetaEstadoIncidencia(valor),
      cantidad: conteo[valor],
    })),
  ];
  return (
    <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {pestanas.map(({ valor, texto, cantidad }) => {
        const activa = filtros.estado === valor;
        return (
          <Link
            key={valor ?? 'todas'}
            href={enlace(filtros, { estado: valor })}
            aria-current={activa ? 'page' : undefined}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-primario ${activa ? 'border-primario bg-primario text-fondo' : 'border-borde bg-superficie text-texto hover:bg-primario-suave'}`}
          >
            {texto} <span className={activa ? 'text-fondo/70' : 'text-texto-suave'}>({cantidad})</span>
          </Link>
        );
      })}
    </nav>
  );
}

function FiltroActivo({ texto, quitar }: { texto: string; quitar: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-borde px-3 py-1 text-sm">
      {texto}
      <Link href={quitar} className="text-primario underline-offset-4 hover:underline">
        Quitar
      </Link>
    </span>
  );
}

export default async function PaginaIncidencias({ searchParams }: Props) {
  const parametros = await searchParams;
  const filtrado = esquemaFiltrosIncidencias.safeParse(parametros);
  const filtros: FiltrosIncidencias = filtrado.success ? filtrado.data : {};
  const pagina = normalizarPagina(parametros.pagina);
  // Las pestañas cuentan con los demás filtros aplicados, para que coincidan con la lista.
  const [resultado, tecnicos, conteo] = await Promise.all([
    paginarIncidencias(filtros, pagina, TAMANO_PAGINA_INCIDENCIAS),
    tecnicosDeLaPeticion(),
    contarIncidenciasPorEstado({
      equipoCodigo: filtros.equipoCodigo,
      busqueda: filtros.busqueda,
      tecnicoId: filtros.tecnicoId,
    }),
  ]);
  const tecnicoFiltrado = tecnicos.find((t) => t.id === filtros.tecnicoId);
  const consultaExportar = enlace(filtros).split('?')[1];

  return (
    <>
      <EncabezadoPagina
        etiqueta="Seguimiento de fallas"
        titulo="Incidencias"
        descripcion="Todas las incidencias reportadas, de la más reciente a la más antigua. Los filtros se combinan y quedan en la dirección de la página."
      >
        <a
          href={`/api/soporte/exportar/incidencias${consultaExportar ? `?${consultaExportar}` : ''}`}
          className={`${clasesBoton('secundario')} gap-2`}
          download
        >
          <Icono nombre="exportar" /> Exportar CSV
        </a>
      </EncabezadoPagina>

      <Pestanas filtros={filtros} conteo={conteo} />

      {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
      <form
        method="get"
        action="/soporte/incidencias"
        className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_auto]"
      >
        {filtros.estado ? <input type="hidden" name="estado" value={filtros.estado} /> : null}
        {filtros.equipoCodigo ? (
          <input type="hidden" name="equipoCodigo" value={filtros.equipoCodigo} />
        ) : null}
        <Campo
          etiqueta="Buscar"
          name="busqueda"
          type="search"
          placeholder="Número de caso, código de equipo o texto de la falla"
          defaultValue={filtros.busqueda ?? ''}
          maxLength={80}
        />
        <Selector
          etiqueta="Técnico"
          name="tecnicoId"
          defaultValue={filtros.tecnicoId ?? ''}
          opciones={[
            { valor: '', texto: 'Todos los técnicos' },
            ...tecnicos.map((t) => ({ valor: t.id, texto: t.activo ? t.nombre : `${t.nombre} (inactivo)` })),
          ]}
        />
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
      </form>

      {filtros.equipoCodigo || tecnicoFiltrado || filtros.busqueda ? (
        <div className="flex flex-wrap gap-2">
          {filtros.equipoCodigo ? (
            <FiltroActivo
              texto={`Equipo ${filtros.equipoCodigo}`}
              quitar={enlace(filtros, { equipoCodigo: undefined })}
            />
          ) : null}
          {tecnicoFiltrado ? (
            <FiltroActivo
              texto={`Técnico: ${tecnicoFiltrado.nombre}`}
              quitar={enlace(filtros, { tecnicoId: undefined })}
            />
          ) : null}
          {filtros.busqueda ? (
            <FiltroActivo
              texto={`Búsqueda: "${filtros.busqueda}"`}
              quitar={enlace(filtros, { busqueda: undefined })}
            />
          ) : null}
        </div>
      ) : null}

      <p role="status" className="text-sm text-texto-suave">
        {plural(resultado.total, 'incidencia', 'incidencias')}
        {filtros.estado ? ` en estado "${etiquetaEstadoIncidencia(filtros.estado)}"` : ''}
        {filtros.equipoCodigo ? ` del equipo ${filtros.equipoCodigo}` : ''}
        {tecnicoFiltrado ? ` de ${tecnicoFiltrado.nombre}` : ''}
      </p>

      {!resultado.filas.length && resultado.total > 0 ? (
        <EstadoVacio titulo={`La página ${pagina} no existe`}>
          <Link href={enlace(filtros)} className="font-medium text-primario underline-offset-4 hover:underline">
            Ir a la primera página
          </Link>
        </EstadoVacio>
      ) : (
        <HistorialIncidencias
          incidencias={resultado.filas}
          tecnicos={tecnicos}
          mostrarEquipo
          textoVacio="No hay incidencias para mostrar"
        />
      )}

      <Paginacion
        pagina={resultado.pagina}
        paginas={resultado.paginas}
        total={resultado.total}
        tamano={resultado.tamano}
        enlace={(numero) => enlace(filtros, { pagina: numero })}
        nombre="incidencias"
      />
    </>
  );
}
