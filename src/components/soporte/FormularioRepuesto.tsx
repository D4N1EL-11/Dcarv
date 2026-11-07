'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { esquemaRepuesto } from '@/lib/validacion/esquemas';

export function FormularioRepuesto() {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [nombre, setNombre] = useState('');
  const [existencias, setExistencias] = useState('0');
  const [minimo, setMinimo] = useState('1');
  const [costo, setCosto] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const datos = {
      nombre,
      existencias: Number(existencias),
      minimo: Number(minimo),
      ...(costo.trim() ? { costoUnitario: Number(costo) } : {}),
    };
    const validacion = esquemaRepuesto.safeParse(datos);
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? 'Revise los datos ingresados.');
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi('/api/soporte/repuestos', 'POST', validacion.data);
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setError('');
    setNombre('');
    setExistencias('0');
    setCosto('');
    mostrar('exito', `${validacion.data.nombre} quedó registrado.`);
    refrescar();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <Campo
        etiqueta="Nombre del repuesto"
        value={nombre}
        maxLength={80}
        placeholder="Ej.: Memoria RAM 8 GB DDR4"
        autoComplete="off"
        onChange={(evento) => {
          setNombre(evento.target.value);
          setError('');
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Campo
          etiqueta="En bodega"
          type="number"
          min={0}
          value={existencias}
          onChange={(evento) => setExistencias(evento.target.value)}
        />
        <Campo etiqueta="Mínimo" type="number" min={0} value={minimo} onChange={(evento) => setMinimo(evento.target.value)} />
      </div>
      <Campo
        etiqueta="Costo por unidad (COP, opcional)"
        type="number"
        min={0}
        step="any"
        placeholder="Ej.: 180000"
        value={costo}
        onChange={(evento) => setCosto(evento.target.value)}
      />
      <p className="text-xs text-texto-suave">
        Por debajo del mínimo el repuesto se marca para compra. Con el costo se calcula lo invertido en reparar cada equipo.
      </p>
      <Boton type="submit" cargando={cargando || refrescando}>
        Registrar repuesto
      </Boton>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
    </form>
  );
}
