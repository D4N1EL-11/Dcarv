'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { MAXIMO_CANTIDAD_REPUESTO } from '@/lib/config/soporte';

type Opcion = { id: string; nombre: string; existencias: number };

// Anotar en un caso una pieza usada en la reparación: la descuenta de la bodega.
export function UsarRepuesto({ numeroCaso, repuestos }: { numeroCaso: string; repuestos: Opcion[] }) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const disponibles = repuestos.filter((r) => r.existencias > 0);
  const [repuestoId, setRepuestoId] = useState(disponibles[0]?.id ?? '');
  const [cantidad, setCantidad] = useState('1');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!repuestos.length) {
    return (
      <p className="text-sm text-texto-suave">
        Aún no hay repuestos en bodega.{' '}
        <Link href="/soporte/repuestos" className="text-primario underline-offset-4 hover:underline">
          Registrar repuestos
        </Link>
      </p>
    );
  }
  if (!disponibles.length) {
    return <p className="text-sm text-texto-suave">Todos los repuestos están agotados.</p>;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const numero = Number(cantidad);
    setCargando(true);
    const respuesta = await llamarApi(`/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/repuestos`, 'POST', {
      repuestoId,
      cantidad: numero,
    });
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setError('');
    setCantidad('1');
    const nombre = repuestos.find((r) => r.id === repuestoId)?.nombre ?? 'El repuesto';
    mostrar('exito', `${nombre}: ${numero} ${numero === 1 ? 'unidad anotada' : 'unidades anotadas'} en ${numeroCaso}.`);
    refrescar();
  }

  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <Selector
        etiqueta="Repuesto"
        value={repuestoId}
        onChange={(evento) => setRepuestoId(evento.target.value)}
        opciones={disponibles.map((r) => ({ valor: r.id, texto: `${r.nombre} (${r.existencias} en bodega)` }))}
      />
      <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-end gap-3">
        <Campo
          etiqueta="Cantidad"
          type="number"
          min={1}
          max={MAXIMO_CANTIDAD_REPUESTO}
          value={cantidad}
          onChange={(evento) => {
            setCantidad(evento.target.value);
            setError('');
          }}
        />
        <Boton type="submit" variante="secundario" cargando={cargando || refrescando}>
          Anotar repuesto
        </Boton>
      </div>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
    </form>
  );
}
