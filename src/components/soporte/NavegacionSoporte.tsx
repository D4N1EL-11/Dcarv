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
    <header className="sticky top-0 z-40 bg-primario text-white shadow-sm print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/soporte" className="flex items-center gap-2 font-bold">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
          </svg>
          Soporte de Salas
        </Link>
        <button
          type="button"
          className="rounded-lg border border-white/40 px-3 py-1 text-sm md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-soporte"
          onClick={() => setAbierto((valor) => !valor)}
        >
          {abierto ? 'Cerrar menú' : 'Menú'}
        </button>
        <div
          id="menu-soporte"
          className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-40 flex-col gap-1 bg-primario p-4 shadow-md md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:p-0 md:shadow-none`}
        >
          <nav aria-label="Principal" className="flex flex-col gap-1 md:flex-row">
            {ENLACES.map(({ href, texto }) => (
              <Link
                key={href}
                href={href}
                aria-current={activo(href) ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm hover:bg-white/15 ${activo(href) ? 'bg-white/20 font-semibold' : ''}`}
              >
                {texto}
                {href === '/soporte/alertas' && alertas > 0 ? (
                  <span className="rounded-full bg-white px-1.5 text-xs font-bold text-baja">
                    {alertas}
                    <span className="sr-only">
                      {alertas === 1 ? ' equipo candidato a baja' : ' equipos candidatos a baja'}
                    </span>
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between gap-3 md:mt-0">
            <span className="truncate text-sm text-white/85" title={email}>
              {email}
            </span>
            <Boton
              variante="secundario"
              className="shrink-0"
              cargando={saliendo}
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </Boton>
          </div>
        </div>
      </div>
    </header>
  );
}
