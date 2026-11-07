import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioArticulo } from '@/components/soporte/FormularioArticulo';
import { EtiquetaCategoria } from '@/components/soporte/InsigniasClasificacion';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono } from '@/components/ui/Icono';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { esSoporte } from '@/lib/auth/permisos';
import { obtenerSesion } from '@/lib/auth/sesion';
import { buscarArticulos } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { esquemaBusquedaConocimiento } from '@/lib/validacion/esquemas';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Base de conocimiento' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Guías de solución: cualquiera las busca y las lee; soporte las escribe.
export default async function PaginaConocimiento({ searchParams }: Props) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  const soporte = esSoporte(sesion.rol);
  const filtrado = esquemaBusquedaConocimiento.safeParse(await searchParams);
  const q = filtrado.success ? (filtrado.data.q ?? '') : '';
  const articulos = await buscarArticulos(q);

  const listado = (
    <section aria-labelledby="titulo-guias" className="grid content-start gap-5">
      <form method="get" action="/soporte/conocimiento" className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Campo etiqueta="Buscar una guía" name="q" type="search" defaultValue={q} placeholder="Ej.: no hay internet, proyector, teclado" />
        <Boton type="submit" variante="secundario">
          Buscar
        </Boton>
      </form>
      <TituloSeccion id="titulo-guias" titulo={q ? `Resultados para “${q}”` : 'Guías más útiles'}>
        <span className="text-sm text-texto-suave">{plural(articulos.length, 'guía', 'guías')}</span>
      </TituloSeccion>
      {articulos.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {articulos.map((a) => (
            <li key={a.id}>
              <Tarjeta className="relative grid h-full content-start gap-2 transition hover:border-primario/50">
                <h3 className="text-lg font-semibold leading-tight text-texto">
                  <Link href={`/soporte/conocimiento/${a.id}`} className="after:absolute after:inset-0 after:rounded-lg">
                    {a.titulo}
                  </Link>
                </h3>
                <p className="line-clamp-3 whitespace-pre-line text-sm text-texto-suave">{a.contenido}</p>
                <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-texto-suave">
                  <EtiquetaCategoria categoria={a.categoria} />
                  {a.utilSi ? (
                    <span className="inline-flex items-center gap-1">
                      <Icono nombre="check" className="size-3.5" /> {plural(a.utilSi, 'persona la encontró útil', 'personas la encontraron útil')}
                    </span>
                  ) : null}
                </p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio titulo={q ? 'Ninguna guía coincide' : 'Aún no hay guías'} icono="libro">
          {q ? 'Pruebe con otras palabras.' : soporte ? 'Escriba la primera con el formulario.' : 'Pronto soporte publicará guías.'}
          {!soporte ? (
            <>
              {' '}
              <Link href="/soporte/reportar" className="text-primario underline-offset-4 hover:underline">
                Reportar una falla
              </Link>
            </>
          ) : null}
        </EstadoVacio>
      )}
    </section>
  );

  return (
    <>
      <EncabezadoPagina
        etiqueta="Autoservicio"
        titulo="Base de conocimiento"
        descripcion="Soluciones a las fallas más comunes de las salas. Pruebe una guía antes de reportar: muchas fallas se resuelven en un minuto."
      />
      {soporte ? (
        <div className="grid items-start gap-10 xl:grid-cols-[26rem_minmax(0,1fr)] xl:gap-8">
          <Tarjeta className="grid gap-3 xl:sticky xl:top-24">
            <h2 className="text-xl font-medium">Escribir una guía</h2>
            <FormularioArticulo />
          </Tarjeta>
          {listado}
        </div>
      ) : (
        listado
      )}
    </>
  );
}
