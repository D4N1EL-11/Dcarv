import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HistorialIncidencias } from '@/components/soporte/HistorialIncidencias';
import { clasesBoton } from '@/components/ui/Boton';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Paginacion } from '@/components/ui/Paginacion';
import { obtenerSesion } from '@/lib/auth/sesion';
import { TAMANO_PAGINA_INCIDENCIAS } from '@/lib/config/soporte';
import { contarIncidenciasPorEstado, paginarIncidencias } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { normalizarPagina } from '@/lib/reglas/paginacion';

export const metadata: Metadata = { title: 'Mis reportes' };

type Props = { searchParams: Promise<{ pagina?: string | string[] }> };

// Los casos que reportó esta cuenta, del más reciente al más antiguo, solo para consultar.
export default async function PaginaMisReportes({ searchParams }: Props) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login?siguiente=%2Fsoporte%2Fmis-reportes');
  const pagina = normalizarPagina((await searchParams).pagina);
  const filtro = { reportadoPor: sesion.id };
  const [resultado, conteo] = await Promise.all([
    paginarIncidencias(filtro, pagina, TAMANO_PAGINA_INCIDENCIAS),
    contarIncidenciasPorEstado(filtro),
  ]);
  const pendientes = conteo.abierta + conteo.en_revision;

  return (
    <>
      <EncabezadoPagina
        etiqueta={resultado.total ? plural(resultado.total, 'reporte', 'reportes') : 'Sin reportes'}
        titulo="Mis reportes"
        descripcion={
          resultado.total
            ? `${plural(pendientes, 'caso sigue', 'casos siguen')} en atención y ${plural(conteo.cerrada, 'está resuelto', 'están resueltos')}. "Abierta" es que soporte aún no lo toma; "En revisión", que un técnico lo atiende; "Cerrada", que ya se resolvió. Pulse el número de caso para ver su detalle y conversar con soporte.`
            : 'Aquí verá el estado de cada falla que reporte.'
        }
      >
        <Link href="/soporte/reportar" className={clasesBoton()}>
          Reportar una falla
        </Link>
      </EncabezadoPagina>
      <HistorialIncidencias
        incidencias={resultado.filas}
        tecnicos={[]}
        mostrarEquipo
        soloLectura
        textoVacio="Todavía no ha reportado ninguna falla"
      />
      <Paginacion
        pagina={resultado.pagina}
        paginas={resultado.paginas}
        total={resultado.total}
        tamano={resultado.tamano}
        enlace={(numero) => (numero > 1 ? `/soporte/mis-reportes?pagina=${numero}` : '/soporte/mis-reportes')}
        nombre="reportes"
      />
    </>
  );
}
