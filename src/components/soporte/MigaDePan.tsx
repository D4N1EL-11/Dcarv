import Link from 'next/link';
import { Icono } from '@/components/ui/Icono';

type Paso = { texto: string; href?: string | undefined };

export function MigaDePan({ pasos }: { pasos: Paso[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm text-texto-suave">
      <ol className="flex flex-wrap items-center gap-1.5">
        {pasos.map((paso, indice) => (
          <li key={`${paso.texto}-${indice}`} className="flex items-center gap-1.5">
            {indice > 0 ? <Icono nombre="derecha" className="size-3.5 opacity-60" /> : null}
            {paso.href ? (
              <Link href={paso.href} className="transition hover:text-primario">
                {paso.texto}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-texto">
                {paso.texto}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
