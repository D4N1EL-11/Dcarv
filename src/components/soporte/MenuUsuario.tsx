'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { OpcionInstalar } from '@/components/pwa/OpcionInstalar';
import { Icono } from '@/components/ui/Icono';
import { esSoporte, nombreRol, type Rol } from '@/lib/auth/permisos';

export const CLASES_OPCION =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-texto transition hover:bg-primario-suave';

export function MenuUsuario({ email, rol }: { email: string; rol: Rol }) {
  const router = useRouter();
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => setAbierto(false), [ruta]);

  // Se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    function fuera(evento: MouseEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function escape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  async function cerrarSesion() {
    setSaliendo(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const inicial = email.trim().charAt(0).toUpperCase() || '?';

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Cuenta de ${email}`}
        onClick={() => setAbierto((valor) => !valor)}
        className="grid size-9 place-items-center rounded-full border border-primario/50 font-titulo text-base font-semibold text-primario transition hover:border-primario"
      >
        {inicial}
      </button>
      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-borde bg-superficie p-2 shadow-2xl shadow-black/50"
        >
          <div className="border-b border-borde px-3 pb-2 pt-1">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-texto-suave">Sesión iniciada</p>
            <p className="truncate text-sm text-texto" title={email}>{email}</p>
            <p className="mt-1 text-xs text-primario">{nombreRol(rol)}</p>
          </div>
          <div className="grid gap-0.5 pt-2">
            <Link role="menuitem" href="/soporte/cuenta" className={CLASES_OPCION}>
              <Icono nombre="llave" className="size-4 text-texto-suave" /> Mi cuenta
            </Link>
            <Link role="menuitem" href="/soporte/avisos" className={CLASES_OPCION}>
              <Icono nombre="campana" className="size-4 text-texto-suave" /> Avisos
            </Link>
            {esSoporte(rol) ? (
              <Link role="menuitem" href="/soporte/informe" className={CLASES_OPCION}>
                <Icono nombre="informe" className="size-4 text-texto-suave" /> Informe mensual
              </Link>
            ) : null}
            {esSoporte(rol) ? (
              <Link role="menuitem" href="/soporte/actividad" className={CLASES_OPCION}>
                <Icono nombre="reloj" className="size-4 text-texto-suave" /> Registro de cambios
              </Link>
            ) : null}
            {rol === 'admin' ? (
              <Link role="menuitem" href="/soporte/usuarios" className={CLASES_OPCION}>
                <Icono nombre="usuario" className="size-4 text-texto-suave" /> Cuentas y roles
              </Link>
            ) : null}
            <Link role="menuitem" href="/soporte/ayuda" className={CLASES_OPCION}>
              <Icono nombre="ayuda" className="size-4 text-texto-suave" /> Ayuda y reglas
            </Link>
            <OpcionInstalar className={CLASES_OPCION} />
            <button role="menuitem" type="button" onClick={cerrarSesion} disabled={saliendo} className={`${CLASES_OPCION} text-baja`}>
              <Icono nombre="salir" className="size-4" /> {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
