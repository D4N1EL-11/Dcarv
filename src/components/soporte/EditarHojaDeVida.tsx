'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Modal } from '@/components/ui/Modal';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import type { HojaDeVida } from '@/lib/reglas/hojaDeVida';
import { esquemaHojaDeVida } from '@/lib/validacion/esquemas';

type Formulario = Record<keyof HojaDeVida, string>;

const CAMPOS: { campo: keyof HojaDeVida; etiqueta: string; tipo?: string; ejemplo?: string; maximo?: number }[] = [
  { campo: 'marcaModelo', etiqueta: 'Marca y modelo', ejemplo: 'Dell OptiPlex 7010', maximo: 80 },
  { campo: 'numeroSerie', etiqueta: 'Número de serie', ejemplo: 'SN-4F7K2', maximo: 60 },
  { campo: 'procesador', etiqueta: 'Procesador', ejemplo: 'Intel Core i5-13500', maximo: 80 },
  { campo: 'sistemaOperativo', etiqueta: 'Sistema operativo', ejemplo: 'Windows 11 Educación', maximo: 60 },
  { campo: 'ramGb', etiqueta: 'Memoria RAM (GB)', tipo: 'number', ejemplo: '16' },
  { campo: 'discoGb', etiqueta: 'Disco (GB)', tipo: 'number', ejemplo: '512' },
  { campo: 'fechaCompra', etiqueta: 'Fecha de compra', tipo: 'date' },
  { campo: 'garantiaHasta', etiqueta: 'Garantía hasta', tipo: 'date' },
];

// Editar la ficha técnica del equipo. Un campo vacío queda "sin dato".
export function EditarHojaDeVida({ codigo, hoja }: { codigo: string; hoja: HojaDeVida }) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const inicial = Object.fromEntries(CAMPOS.map(({ campo }) => [campo, hoja[campo] === null ? '' : String(hoja[campo])])) as Formulario;
  const [valores, setValores] = useState<Formulario>(inicial);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const datos = {
      ...valores,
      ramGb: valores.ramGb.trim() ? Number(valores.ramGb) : null,
      discoGb: valores.discoGb.trim() ? Number(valores.discoGb) : null,
    };
    const validacion = esquemaHojaDeVida.safeParse(datos);
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? 'Revise los datos ingresados.');
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi(`/api/soporte/equipos/${encodeURIComponent(codigo)}/hoja-de-vida`, 'PUT', validacion.data);
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setAbierto(false);
    mostrar('exito', `La ficha técnica de ${codigo} quedó actualizada.`);
    refrescar();
  }

  return (
    <>
      <Boton
        variante="secundario"
        className="gap-2"
        onClick={() => {
          setValores(inicial);
          setError('');
          setAbierto(true);
        }}
      >
        <Icono nombre="editar" /> Editar ficha técnica
      </Boton>
      {abierto ? (
        <Modal titulo={`Ficha técnica de ${codigo}`} amplio alCerrar={() => setAbierto(false)}>
          <form onSubmit={enviar} className="grid gap-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              {CAMPOS.map(({ campo, etiqueta, tipo, ejemplo, maximo }) => (
                <Campo
                  key={campo}
                  etiqueta={etiqueta}
                  type={tipo ?? 'text'}
                  value={valores[campo]}
                  placeholder={ejemplo}
                  maxLength={maximo}
                  min={tipo === 'number' ? 1 : undefined}
                  onChange={(evento) => {
                    setValores((actual) => ({ ...actual, [campo]: evento.target.value }));
                    setError('');
                  }}
                />
              ))}
            </div>
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
