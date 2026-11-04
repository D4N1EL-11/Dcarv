'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { llamarApi } from '@/lib/clienteApi';
import { esquemaEquipo } from '@/lib/validacion/esquemas';

type Props = {
  salas: { id: string; nombre: string }[];
  salaInicial?: string | undefined;
};

export function FormularioEquipo({ salas, salaInicial = '' }: Props) {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [salaId, setSalaId] = useState(salaInicial);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const datos = esquemaEquipo.safeParse({ codigo, salaId });
    if (!datos.success) {
      setError(datos.error.issues[0]?.message ?? 'Revise los datos ingresados.');
      return;
    }
    setError('');
    setCargando(true);
    const respuesta = await llamarApi<{ codigo: string }>('/api/soporte/equipos', 'POST', datos.data);
    if (respuesta.ok) {
      router.push(`/soporte/equipos/${encodeURIComponent(respuesta.datos.codigo)}`);
      return;
    }
    setCargando(false);
    setError(respuesta.mensaje);
  }

  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <Campo
        etiqueta="Código del equipo"
        placeholder="PC-SALA1-03"
        value={codigo}
        maxLength={40}
        onChange={(evento) => setCodigo(evento.target.value)}
      />
      <Selector
        etiqueta="Sala"
        value={salaId}
        onChange={(evento) => setSalaId(evento.target.value)}
        opciones={[
          { valor: '', texto: 'Seleccione una sala' },
          ...salas.map((sala) => ({ valor: sala.id, texto: sala.nombre })),
        ]}
      />
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      <div>
        <Boton type="submit" cargando={cargando}>
          Registrar equipo
        </Boton>
      </div>
    </form>
  );
}
