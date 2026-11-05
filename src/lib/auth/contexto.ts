import { AsyncLocalStorage } from 'node:async_hooks';
import type { Rol } from './permisos';

// Quién hace la petición en curso, sin pasarlo por cada función. conManejoDeErrores abre el
// contexto de cada petición a la API; exigirSesion() anota a la persona; lib/datos lo lee para el
// registro de cambios. Fuera de una petición (cron, scripts) no hay actor: cuenta como 'sistema'.

export type Actor = { id: string; email: string; rol: Rol };
type Contexto = { actor: Actor | null };

const almacen = new AsyncLocalStorage<Contexto>();

export function conContexto<T>(funcion: () => T): T {
  return almacen.run({ actor: null }, funcion);
}

export function fijarActor(actor: Actor): void {
  const contexto = almacen.getStore();
  if (contexto) contexto.actor = actor;
}

export function actorActual(): Actor | null {
  return almacen.getStore()?.actor ?? null;
}
