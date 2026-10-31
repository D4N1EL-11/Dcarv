'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';

const ENLACES = [
  { href: '/soporte', texto: 'Panel' },
  { href: '/soporte/incidencias', texto: 'Incidencias' },
  { href: '/soporte/salas', texto: 'Salas' },
  { href: '/soporte/tecnicos', texto: 'Técnicos' },
  { href: '/soporte/alertas', texto: 'Alertas' },
];

export function NavegacionSoporte({ email }: { email: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const activo = (href: string) =>
    href === '/soporte' ? ruta === href : ruta.startsWith(href);

  return (
    <header className="bg-primario text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/soporte" className="font-bold">
          Soporte de Salas
        </Link>
        <button
          type="button"
          className="rounded-lg border border-white/40 px-3 py-1 text-sm md:hidden"
          aria-expanded={abierto}
          aria-controls="menu-soporte"
          onClick={() => setAbierto((valor) => !valor)}
        >
          Menú
        </button>
        <div
          id="menu-soporte"
          className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-12 z-40 flex-col gap-1 bg-primario p-4 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:p-0`}
        >
          <nav aria-label="Principal" className="flex flex-col gap-1 md:flex-row">
            {ENLACES.map(({ href, texto }) => (
              <Link
                key={href}
                href={href}
                aria-current={activo(href) ? 'page' : undefined}
                onClick={() => setAbierto(false)}
                className={`rounded-lg px-3 py-1.5 text-sm hover:bg-white/15 ${activo(href) ? 'bg-white/20 font-semibold' : ''}`}
              >
                {texto}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between gap-3 md:mt-0">
            <span className="truncate text-sm text-white/85">{email}</span>
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
