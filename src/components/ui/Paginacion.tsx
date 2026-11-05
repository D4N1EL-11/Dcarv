import Link from 'next/link';
import { rangoVisible } from '@/lib/reglas/paginacion';

type Props = {
  pagina: number;
  paginas: number;
  total: number;
  tamano: number;
  // Construye la URL de una página conservando los filtros actuales.
  enlace: (pagina: number) => string;
  nombre: string;
};

const CLASES_ENLACE =
  'rounded-lg border border-borde px-3 py-1.5 text-sm transition hover:border-primario/60 hover:text-primario focus-visible:outline-2 focus-visible:outline-primario';

// Enlaces normales (sin JavaScript): cada página tiene su URL y se puede compartir o recargar.
export function Paginacion({ pagina, paginas, total, tamano, enlace, nombre }: Props) {
  if (total <= tamano) return null;
  const { desde, hasta } = rangoVisible(pagina, tamano, total);
  return (
    <nav
      aria-label={`Páginas de ${nombre}`}
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-texto-suave"
    >
      <p>
        Mostrando {desde}–{hasta} de {total} {nombre}
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link href={enlace(pagina - 1)} className={CLASES_ENLACE} rel="prev">
            Anterior
          </Link>
        ) : null}
        <span aria-current="page" className="px-2">
          Página {pagina} de {paginas}
        </span>
        {pagina < paginas ? (
          <Link href={enlace(pagina + 1)} className={CLASES_ENLACE} rel="next">
            Siguiente
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
