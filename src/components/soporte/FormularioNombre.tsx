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
  ejemplo: string;
  validar: (nombre: string) => string | undefined;
};

// Base común de FormularioSala y FormularioTecnico: ambos solo piden un nombre.
export function FormularioNombre({ url, etiqueta, textoBoton, maximo, ejemplo, validar }: Props) {
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
    // Una sola fila (campo y botón) desde 640 px: el formulario pide un solo dato.
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Campo
          etiqueta={etiqueta}
          value={nombre}
          maxLength={maximo}
          placeholder={ejemplo}
          autoComplete="off"
          onChange={(evento) => {
            setNombre(evento.target.value);
            setError('');
          }}
        />
        <Boton type="submit" cargando={cargando || refrescando} className="sm:min-w-44">
          {textoBoton}
        </Boton>
      </div>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
    </form>
  );
}
