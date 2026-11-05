'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';

type Props = {
  url: string;
  etiqueta: string;
  textoBoton: string;
  maximo: number;
  validar: (nombre: string) => string | undefined;
};

// Base común de FormularioSala y FormularioTecnico: ambos solo piden un nombre.
export function FormularioNombre({ url, etiqueta, textoBoton, maximo, validar }: Props) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const problema = validar(nombre);
    if (problema) {
      setError(problema);
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi(url, 'POST', { nombre });
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setError('');
    setNombre('');
    mostrar('exito', `${nombre.trim()} quedó registrado.`);
    refrescar();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <Campo
        etiqueta={etiqueta}
        value={nombre}
        maxLength={maximo}
        onChange={(evento) => setNombre(evento.target.value)}
      />
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      <div>
        <Boton type="submit" cargando={cargando || refrescando}>
          {textoBoton}
        </Boton>
      </div>
    </form>
  );
}
