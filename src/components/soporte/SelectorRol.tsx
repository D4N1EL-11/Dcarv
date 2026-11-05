'use client';

import { useState } from 'react';
import { useAvisos } from '@/components/ui/Avisos';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { nombreRol, type Rol } from '@/lib/auth/permisos';
import { llamarApi } from '@/lib/clienteApi';

const ROLES: Rol[] = ['viewer', 'editor', 'admin'];

export function SelectorRol({ id, email, rol, propia }: { id: string; email: string; rol: Rol; propia: boolean }) {
  const { mostrar } = useAvisos();
  const { refrescar, refrescando } = useRefrescar();
  const [valor, setValor] = useState<Rol>(rol);
  const [guardando, setGuardando] = useState(false);

  async function cambiar(nuevo: Rol) {
    const anterior = valor;
    setValor(nuevo);
    setGuardando(true);
    const respuesta = await llamarApi(`/api/soporte/usuarios/${id}`, 'PATCH', { rol: nuevo });
    setGuardando(false);
    if (!respuesta.ok) {
      setValor(anterior);
      mostrar('error', respuesta.mensaje);
      return;
    }
    mostrar('exito', `${email} ahora es: ${nombreRol(nuevo)}.`);
    refrescar();
  }

  return (
    <Selector
      etiqueta={`Rol de ${email}`}
      ocultarEtiqueta
      compacto
      value={valor}
      disabled={propia || guardando || refrescando}
      title={propia ? 'No puede cambiar el rol de su propia cuenta.' : undefined}
      onChange={(evento) => void cambiar(evento.target.value as Rol)}
      opciones={ROLES.map((r) => ({ valor: r, texto: nombreRol(r) }))}
    />
  );
}
