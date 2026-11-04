import Link from 'next/link';

type Paso = { texto: string; href?: string | undefined };

export function MigaDePan({ pasos }: { pasos: Paso[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm text-texto-suave">
      <ol className="flex flex-wrap items-center gap-1">
        {pasos.map((paso, indice) => (
          <li key={`${paso.texto}-${indice}`} className="flex items-center gap-1">
            {indice > 0 ? <span aria-hidden="true">/</span> : null}
            {paso.href ? (
              <Link href={paso.href} className="text-primario underline">
                {paso.texto}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-texto">
                {paso.texto}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
