'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';
import { Icono } from '@/components/ui/Icono';

export function BotonCerrarSesion() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/login');
    router.refresh();
  }

  return (
    <Boton variante="peligro" onClick={cerrarSesion} cargando={saliendo}>
      {saliendo ? null : <Icono nombre="salir" />}
      Cerrar sesión
    </Boton>
  );
}
