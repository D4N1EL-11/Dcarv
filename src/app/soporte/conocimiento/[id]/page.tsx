import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AccionesArticulo } from '@/components/soporte/AccionesArticulo';
import { EtiquetaCategoria } from '@/components/soporte/InsigniasClasificacion';
import { MigaDePan } from '@/components/soporte/MigaDePan';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { esSoporte } from '@/lib/auth/permisos';
import { obtenerSesion } from '@/lib/auth/sesion';
import { obtenerArticulo, type Articulo } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaId } from '@/lib/validacion/esquemas';

type Props = { params: Promise<{ id: string }> };

async function cargar(id: string): Promise<Articulo> {
  const valido = esquemaId.safeParse(id);
  if (!valido.success) notFound();
  try {
    return await obtenerArticulo(valido.data);
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'ARTICULO_NO_ENCONTRADO') notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const valido = esquemaId.safeParse((await params).id);
  if (!valido.success) return { title: 'Guía' };
  try {
    return { title: (await obtenerArticulo(valido.data)).titulo };
  } catch {
    return { title: 'Guía' };
  }
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' });

export default async function PaginaArticulo({ params }: Props) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  const articulo = await cargar((await params).id);
  const soporte = esSoporte(sesion.rol);

  return (
    <>
      <div className="print:hidden">
        <MigaDePan pasos={[{ texto: 'Base de conocimiento', href: '/soporte/conocimiento' }, { texto: articulo.titulo }]} />
      </div>
      <EncabezadoPagina
        etiqueta="Guía de solución"
        titulo={articulo.titulo}
        descripcion={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <EtiquetaCategoria categoria={articulo.categoria} />
            <span>Actualizada el {formatoFecha.format(new Date(articulo.actualizadoEn))}</span>
          </span>
        }
      />
      <Tarjeta className="grid max-w-4xl gap-6 p-6 sm:p-8">
        <div className="whitespace-pre-line break-words text-base leading-relaxed text-texto">{articulo.contenido}</div>
        {articulo.palabrasClave ? <p className="text-xs text-texto-suave">Palabras clave: {articulo.palabrasClave}</p> : null}
        <AccionesArticulo
          soporte={soporte}
          articulo={{
            id: articulo.id,
            titulo: articulo.titulo,
            categoria: articulo.categoria,
            contenido: articulo.contenido,
            palabrasClave: articulo.palabrasClave,
          }}
        />
      </Tarjeta>
    </>
  );
}
