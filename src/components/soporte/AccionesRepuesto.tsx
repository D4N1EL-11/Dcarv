'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { esquemaActualizarRepuesto } from '@/lib/validacion/esquemas';

// Entrada a bodega (compra o devolución) y cambio del mínimo o del costo de un repuesto.
export function AccionesRepuesto({ id, nombre, minimo, costo }: { id: string; nombre: string; minimo: number; costo: number }) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const [entrada, setEntrada] = useState('');
  const [nuevoMinimo, setNuevoMinimo] = useState(String(minimo));
  const [nuevoCosto, setNuevoCosto] = useState(String(costo));
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const datos = {
      ...(entrada.trim() ? { entrada: Number(entrada) } : {}),
      ...(Number(nuevoMinimo) !== minimo ? { minimo: Number(nuevoMinimo) } : {}),
      ...(nuevoCosto.trim() && Number(nuevoCosto) !== costo ? { costoUnitario: Number(nuevoCosto) } : {}),
    };
    const validacion = esquemaActualizarRepuesto.safeParse(datos);
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? 'Revise los datos ingresados.');
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi(`/api/soporte/repuestos/${id}`, 'PATCH', validacion.data);
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setAbierto(false);
    setEntrada('');
    setError('');
    mostrar('exito', `${nombre} quedó actualizado.`);
    refrescar();
  }

  return (
    <>
      <Boton variante="fantasma" className="px-3 py-1.5" onClick={() => setAbierto(true)}>
        Entrada / mínimo / costo
      </Boton>
      {abierto ? (
        <Modal titulo={nombre} alCerrar={() => setAbierto(false)}>
          <form onSubmit={enviar} className="grid gap-3" noValidate>
            <Campo
              etiqueta="Unidades que entran a bodega"
              type="number"
              min={1}
              placeholder="Ej.: 10"
              value={entrada}
              autoFocus
              onChange={(evento) => {
                setEntrada(evento.target.value);
                setError('');
              }}
            />
            <Campo
              etiqueta="Mínimo en bodega"
              type="number"
              min={0}
              value={nuevoMinimo}
              onChange={(evento) => {
                setNuevoMinimo(evento.target.value);
                setError('');
              }}
            />
            <Campo
              etiqueta="Costo por unidad (COP)"
              type="number"
              min={0}
              step="any"
              value={nuevoCosto}
              onChange={(evento) => {
                setNuevoCosto(evento.target.value);
                setError('');
              }}
            />
            {error ? <Aviso tipo="error">{error}</Aviso> : null}
            <div className="flex justify-end gap-2">
              <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" cargando={cargando || refrescando}>
                Guardar
              </Boton>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
