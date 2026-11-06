import type { Metadata } from 'next';
import Link from 'next/link';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { ResumenIncidencias } from '@/components/soporte/ResumenIncidencias';
import { Boton, clasesBoton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Icono } from '@/components/ui/Icono';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Paginacion } from '@/components/ui/Paginacion';
import { Selector } from '@/components/ui/Selector';
import {
  CATEGORIAS_INCIDENCIA,
  ESTADOS_INCIDENCIA,
  PRIORIDADES_INCIDENCIA,
  TAMANO_PAGINA_INCIDENCIAS,
} from '@/lib/config/soporte';
import { tecnicosDeLaPeticion } from '@/lib/consultasDePagina';
import {
  contarIncidenciasPorEstado,
  listarSalas,
  paginarIncidencias,
  resumenCierres,
  type ConteoIncidencias,
  type FiltrosIncidencias,
} from '@/lib/dataService';
import { etiquetaEstadoIncidencia, plural } from '@/lib/formato';
import { ETIQUETA_CATEGORIA, ETIQUETA_PRIORIDAD } from '@/lib/reglas/clasificacion';
import { normalizarPagina } from '@/lib/reglas/paginacion';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';
import { soloSoporte } from '@/lib/auth/sesion';

export const metadata: Metadata = { title: 'Incidencias' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Una sola función arma todas las URLs: los filtros que no se cambian se conservan, y cambiar
// cualquier filtro vuelve a la página 1.
function enlace(filtros: FiltrosIncidencias, cambios: Partial<FiltrosIncidencias> & { pagina?: number } = {}): string {
  const { pagina = 1, ...resto } = cambios;
  const valores = { ...filtros, ...resto };
  const consulta = new URLSearchParams();
  for (const nombre of ['estado', 'busqueda', 'equipoCodigo', 'tecnicoId', 'salaId', 'categoria', 'prioridad'] as const) {
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
  await soloSoporte();
  const parametros = await searchParams;
  const filtrado = esquemaFiltrosIncidencias.safeParse(parametros);
  const filtros: FiltrosIncidencias = filtrado.success ? filtrado.data : {};
  const pagina = normalizarPagina(parametros.pagina);
  // Las pestañas y el resumen cuentan con los demás filtros aplicados, para que coincidan con la lista.
  const sinEstado = {
    equipoCodigo: filtros.equipoCodigo,
    busqueda: filtros.busqueda,
    tecnicoId: filtros.tecnicoId,
    salaId: filtros.salaId,
    categoria: filtros.categoria,
    prioridad: filtros.prioridad,
  };
  const [resultado, tecnicos, conteo, salas, resumen] = await Promise.all([
    paginarIncidencias(filtros, pagina, TAMANO_PAGINA_INCIDENCIAS),
    tecnicosDeLaPeticion(),
    contarIncidenciasPorEstado(sinEstado),
    listarSalas(),
    resumenCierres(sinEstado),
  ]);
  const tecnicoFiltrado = tecnicos.find((t) => t.id === filtros.tecnicoId);
  const salaFiltrada = salas.find((s) => s.id === filtros.salaId);
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

      <ResumenIncidencias conteo={conteo} resumen={resumen} />

      <Pestanas filtros={filtros} conteo={conteo} />

      {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
      <form
        method="get"
        action="/soporte/incidencias"
        className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]"
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
          etiqueta="Sala"
          name="salaId"
          defaultValue={filtros.salaId ?? ''}
          opciones={[{ valor: '', texto: 'Todas las salas' }, ...salas.map((s) => ({ valor: s.id, texto: s.nombre }))]}
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
        <Selector
          etiqueta="Tipo de falla"
          name="categoria"
          defaultValue={filtros.categoria ?? ''}
          opciones={[{ valor: '', texto: 'Todos los tipos' }, ...CATEGORIAS_INCIDENCIA.map((c) => ({ valor: c, texto: ETIQUETA_CATEGORIA[c] }))]}
        />
        <Selector
          etiqueta="Prioridad"
          name="prioridad"
          defaultValue={filtros.prioridad ?? ''}
          opciones={[{ valor: '', texto: 'Todas' }, ...PRIORIDADES_INCIDENCIA.map((p) => ({ valor: p, texto: ETIQUETA_PRIORIDAD[p] }))]}
        />
        <Boton type="submit" variante="secundario">
          Filtrar
        </Boton>
      </form>

      {filtros.equipoCodigo || tecnicoFiltrado || filtros.busqueda || salaFiltrada || filtros.categoria || filtros.prioridad ? (
        <div className="flex flex-wrap items-center gap-2">
          {salaFiltrada ? (
            <FiltroActivo texto={`Sala: ${salaFiltrada.nombre}`} quitar={enlace(filtros, { salaId: undefined })} />
          ) : null}
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
          {filtros.categoria ? (
            <FiltroActivo
              texto={`Tipo: ${ETIQUETA_CATEGORIA[filtros.categoria]}`}
              quitar={enlace(filtros, { categoria: undefined })}
            />
          ) : null}
          {filtros.prioridad ? (
            <FiltroActivo
              texto={`Prioridad ${ETIQUETA_PRIORIDAD[filtros.prioridad].toLowerCase()}`}
              quitar={enlace(filtros, { prioridad: undefined })}
            />
          ) : null}
          {filtros.busqueda ? (
            <FiltroActivo
              texto={`Búsqueda: "${filtros.busqueda}"`}
              quitar={enlace(filtros, { busqueda: undefined })}
            />
          ) : null}
          <Link
            href={enlace({ estado: filtros.estado })}
            className="px-2 text-sm text-texto-suave underline-offset-4 hover:text-primario hover:underline"
          >
            Quitar todos
          </Link>
        </div>
      ) : null}

      <p role="status" className="text-sm text-texto-suave">
        {plural(resultado.total, 'incidencia', 'incidencias')}
        {filtros.estado ? ` en estado "${etiquetaEstadoIncidencia(filtros.estado)}"` : ''}
        {salaFiltrada ? ` en ${salaFiltrada.nombre}` : ''}
        {filtros.equipoCodigo ? ` del equipo ${filtros.equipoCodigo}` : ''}
        {tecnicoFiltrado ? ` de ${tecnicoFiltrado.nombre}` : ''}
        {filtros.categoria ? ` de tipo ${ETIQUETA_CATEGORIA[filtros.categoria].toLowerCase()}` : ''}
        {filtros.prioridad ? ` con prioridad ${ETIQUETA_PRIORIDAD[filtros.prioridad].toLowerCase()}` : ''}
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
