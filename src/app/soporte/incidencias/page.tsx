import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { ESTADOS_INCIDENCIA } from '@/lib/config/soporte';
import { listarIncidencias, listarTecnicos } from '@/lib/dataService';
import { etiquetaEstadoIncidencia } from '@/lib/formato';
import { esquemaFiltrosIncidencias } from '@/lib/validacion/esquemas';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaginaIncidencias({ searchParams }: Props) {
  const filtrado = esquemaFiltrosIncidencias.safeParse(await searchParams);
  const filtros = filtrado.success ? filtrado.data : {};
  const [incidencias, tecnicos] = await Promise.all([listarIncidencias(filtros), listarTecnicos()]);

  return (
    <>
      <h1 className="text-2xl font-bold">Incidencias</h1>
      <FiltrosIncidencias estado={filtros.estado ?? ''} equipoCodigo={filtros.equipoCodigo ?? ''} />
      <HistorialIncidencias
        incidencias={incidencias}
        tecnicos={tecnicos}
        mostrarEquipo
        textoVacio="No hay incidencias para mostrar"
      />
    </>
  );
}

function FiltrosIncidencias({ estado, equipoCodigo }: { estado: string; equipoCodigo: string }) {
  return (
    <form method="get" action="/soporte/incidencias" className="grid items-end gap-3 sm:grid-cols-3">
      <Selector
        etiqueta="Estado"
        name="estado"
        defaultValue={estado}
        opciones={[
          { valor: '', texto: 'Todos' },
          ...ESTADOS_INCIDENCIA.map((valor) => ({ valor, texto: etiquetaEstadoIncidencia(valor) })),
        ]}
      />
      <Campo etiqueta="Código del equipo" name="equipoCodigo" defaultValue={equipoCodigo} />
      <Boton type="submit" variante="secundario">
        Filtrar
      </Boton>
    </form>
  );
}
