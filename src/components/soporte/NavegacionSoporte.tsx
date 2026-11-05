'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Boton } from '@/components/ui/Boton';

const ENLACES = [
  { href: '/soporte', texto: 'Panel' },
  { href: '/soporte/incidencias', texto: 'Incidencias' },
  { href: '/soporte/salas', texto: 'Salas' },
  { href: '/soporte/tecnicos', texto: 'Técnicos' },
  { href: '/soporte/alertas', texto: 'Alertas' },
];

type Props = { email: string; alertas: number };

export function NavegacionSoporte({ email, alertas }: Props) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  // Al cambiar de página se cierra el menú móvil.
  useEffect(() => setAbierto(false), [ruta]);

  async function cerrarSesion() {
    setSaliendo(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const activo = (href: string) => (href === '/soporte' ? ruta === href : ruta.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-fondo/85 text-texto backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/soporte" className="group flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full border border-primario/50 font-titulo text-lg font-semibold text-primario transition group-hover:border-primario">
            D
          </span>
          <span className="font-titulo text-xl font-semibold tracking-wide text-primario">Soporte de Salas</span>
        </Link>
        <button
          type="button"
          className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto-suave transition hover:border-primario/60 hover:text-primario md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-soporte"
          onClick={() => setAbierto((valor) => !valor)}
        >
          {abierto ? 'Cerrar menú' : 'Menú'}
        </button>
        <div
          id="menu-soporte"
          className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-40 flex-col gap-1 border-b border-borde bg-fondo p-4 shadow-2xl shadow-black/50 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <nav aria-label="Principal" className="flex flex-col gap-1 md:flex-row md:gap-0">
            {ENLACES.map(({ href, texto }) => (
              <Link
                key={href}
                href={href}
                aria-current={activo(href) ? 'page' : undefined}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition hover:text-texto md:after:absolute md:after:inset-x-3 md:after:-bottom-[1.05rem] md:after:h-px md:after:transition ${activo(href) ? 'text-primario md:after:bg-primario' : 'text-texto-suave md:after:bg-transparent'}`}
              >
                {texto}
                {href === '/soporte/alertas' && alertas > 0 ? (
                  <span className="rounded-full border border-baja/40 bg-baja/15 px-1.5 text-xs font-semibold text-baja">
                    {alertas}
                    <span className="sr-only">
                      {alertas === 1 ? ' equipo candidato a baja' : ' equipos candidatos a baja'}
                    </span>
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between gap-4 md:mt-0">
            <span className="truncate text-xs text-texto-suave" title={email}>
              {email}
            </span>
            <Boton variante="secundario" className="shrink-0 px-3! py-1.5! text-xs!" cargando={saliendo} onClick={cerrarSesion}>
              Cerrar sesión
            </Boton>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="linea-dorada" />
    </header>
  );
}
