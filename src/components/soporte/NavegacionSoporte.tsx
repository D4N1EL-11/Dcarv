'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import {
  contarSinVer,
  EVENTO_ALERTAS_VISTAS,
  EVENTO_DATOS_CAMBIARON,
  leerVistosDelNavegador,
} from '@/lib/alertasVistas';
import { esSoporte, inicioPara, type Rol } from '@/lib/auth/permisos';
import { BuscadorGlobal } from './BuscadorGlobal';
import { MenuUsuario } from './MenuUsuario';

type Enlace = { href: string; texto: string; icono: NombreIcono };

const ENLACES_SOPORTE: Enlace[] = [
  { href: '/soporte', texto: 'Panel', icono: 'panel' },
  { href: '/soporte/incidencias', texto: 'Incidencias', icono: 'incidencias' },
  { href: '/soporte/salas', texto: 'Salas', icono: 'salas' },
  { href: '/soporte/tecnicos', texto: 'Técnicos', icono: 'tecnicos' },
  { href: '/soporte/alertas', texto: 'Alertas', icono: 'alertas' },
];

// Una cuenta de reporte solo reporta fallas y sigue sus casos (lib/auth/permisos.ts).
const ENLACES_REPORTE: Enlace[] = [
  { href: '/soporte/reportar', texto: 'Reportar falla', icono: 'incidencias' },
  { href: '/soporte/mis-reportes', texto: 'Mis reportes', icono: 'check' },
];

// candidatos: códigos de los candidatos a baja; vistos: los que ya se vieron en /soporte/alertas.
type Props = { email: string; rol: Rol; candidatos: string[]; vistos: string[] };

export function NavegacionSoporte({ email, rol, candidatos: candidatosIniciales, vistos: vistosIniciales }: Props) {
  const soporte = esSoporte(rol);
  const enlaces = soporte ? ENLACES_SOPORTE : ENLACES_REPORTE;
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [candidatos, setCandidatos] = useState(candidatosIniciales);
  const [vistos, setVistos] = useState<ReadonlySet<string>>(() => new Set(vistosIniciales));
  const primeraRuta = useRef(true);
  const ultimoTurno = useRef(0);

  // Al cambiar de página se cierra el menú móvil.
  useEffect(() => setAbierto(false), [ruta]);

  // El layout no se vuelve a dibujar al navegar ni al refrescar tras una acción: el número de
  // alertas se pide de nuevo al cambiar de página y cuando una acción avisa que hubo cambios
  // (por ejemplo, dar de baja un equipo lo saca de los candidatos).
  const actualizar = useCallback(async () => {
    if (!soporte) return; // las alertas son de soporte
    const turno = ++ultimoTurno.current; // si dos consultas se cruzan, vale la última
    try {
      const respuesta = await fetch('/api/soporte/alertas', { cache: 'no-store' });
      if (!respuesta.ok || turno !== ultimoTurno.current) return;
      const json = (await respuesta.json()) as { ok: boolean; datos?: { codigo: string }[] };
      if (json.ok && json.datos && turno === ultimoTurno.current) setCandidatos(json.datos.map((c) => c.codigo));
    } catch {
      // Sin red: se conserva el último número conocido.
    }
    setVistos(leerVistosDelNavegador());
  }, [soporte]);

  useEffect(() => {
    if (primeraRuta.current) {
      primeraRuta.current = false; // El servidor ya trajo el número de esta primera página.
      return;
    }
    void actualizar();
  }, [ruta, actualizar]);

  useEffect(() => {
    const releerVistos = () => setVistos(leerVistosDelNavegador());
    const recargar = () => void actualizar();
    window.addEventListener(EVENTO_ALERTAS_VISTAS, releerVistos);
    window.addEventListener(EVENTO_DATOS_CAMBIARON, recargar);
    return () => {
      window.removeEventListener(EVENTO_ALERTAS_VISTAS, releerVistos);
      window.removeEventListener(EVENTO_DATOS_CAMBIARON, recargar);
    };
  }, [actualizar]);

  const alertas = contarSinVer(candidatos, vistos);

  // El Panel también cubre la ficha y el registro de equipos, que cuelgan de él.
  const activo = (href: string) =>
    href === '/soporte' ? ruta === href || ruta.startsWith('/soporte/equipos') : ruta.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-fondo/85 text-texto backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5">
        <Link href={inicioPara(rol)} className="group mr-2 flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full border border-primario/50 font-titulo text-lg font-semibold text-primario transition group-hover:border-primario">
            D
          </span>
          <span className="hidden font-titulo text-xl font-semibold tracking-wide text-primario sm:inline">
            Soporte de Salas
          </span>
        </Link>

        <nav
          id="menu-soporte"
          aria-label="Principal"
          className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-b border-borde bg-fondo p-4 shadow-2xl shadow-black/50 md:static md:flex md:flex-1 md:flex-row md:gap-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {enlaces.map(({ href, texto, icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? 'page' : undefined}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition hover:text-texto md:after:absolute md:after:inset-x-3 md:after:-bottom-[0.9rem] md:after:h-px ${activo(href) ? 'text-primario md:after:bg-primario' : 'text-texto-suave md:after:bg-transparent'}`}
            >
              <Icono nombre={icono} />
              {texto}
              {href === '/soporte/alertas' && alertas > 0 ? (
                <span className="rounded-full border border-baja/40 bg-baja/15 px-1.5 text-xs font-semibold text-baja">
                  {alertas}
                  <span className="sr-only">
                    {alertas === 1 ? ' alerta nueva sin revisar' : ' alertas nuevas sin revisar'}
                  </span>
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {soporte ? <BuscadorGlobal /> : null}
          <MenuUsuario email={email} rol={rol} />
          <button
            type="button"
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto-suave transition hover:border-primario/60 hover:text-primario md:hidden"
            aria-expanded={abierto}
            aria-controls="menu-soporte"
            onClick={() => setAbierto((valor) => !valor)}
          >
            {abierto ? 'Cerrar' : 'Menú'}
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="linea-dorada" />
    </header>
  );
}
