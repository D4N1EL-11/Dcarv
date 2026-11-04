'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { llamarApi } from '@/lib/clienteApi';
import { MAXIMO_LOTE_EQUIPOS } from '@/lib/config/soporte';
import { plural } from '@/lib/formato';
import { generarCodigos } from '@/lib/reglas/equipo';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

type Props = {
  salas: { id: string; nombre: string }[];
  salaInicial?: string | undefined;
};

type Resultado = { codigo: string; creado: boolean; mensaje: string };

function vistaPrevia(codigos: string[]): string {
  if (codigos.length <= 4) return codigos.join(', ');
  return `${codigos.slice(0, 3).join(', ')}, … ${codigos.at(-1)}`;
}

// Registra el inventario de una sala de una vez. Cada código pasa por la misma API
// (y las mismas validaciones) que el registro individual; los repetidos se informan y se saltan.
export function FormularioVariosEquipos({ salas, salaInicial = '' }: Props) {
  const [salaId, setSalaId] = useState(salaInicial);
  const [prefijo, setPrefijo] = useState('');
  const [desde, setDesde] = useState('1');
  const [hasta, setHasta] = useState('10');
  const [digitos, setDigitos] = useState('2');
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  const lote = useMemo(() => {
    if (!prefijo.trim()) return { codigos: [] as string[], problema: '' };
    try {
      return {
        codigos: generarCodigos(prefijo, Number(desde), Number(hasta), Number(digitos)),
        problema: '',
      };
    } catch (excepcion) {
      const mensaje =
        excepcion instanceof ErrorDeNegocio ? excepcion.message : 'Revise los datos ingresados.';
      return { codigos: [] as string[], problema: mensaje };
    }
  }, [prefijo, desde, hasta, digitos]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const problema = !salaId
      ? 'Seleccione una sala.'
      : !prefijo.trim()
        ? 'Escriba el prefijo de los códigos.'
        : lote.problema;
    if (problema) {
      setError(problema);
      return;
    }
    setError('');
    setResultados([]);
    setCargando(true);
    const obtenidos: Resultado[] = [];
    for (const [indice, codigo] of lote.codigos.entries()) {
      setProgreso(indice + 1);
      const respuesta = await llamarApi('/api/soporte/equipos', 'POST', { codigo, salaId });
      obtenidos.push({
        codigo,
        creado: respuesta.ok,
        mensaje: respuesta.ok ? 'Registrado' : respuesta.mensaje,
      });
    }
    setResultados(obtenidos);
    setCargando(false);
  }

  const creados = resultados.filter((r) => r.creado).length;
  const omitidos = resultados.filter((r) => !r.creado);

  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <Selector
        etiqueta="Sala"
        value={salaId}
        onChange={(evento) => setSalaId(evento.target.value)}
        opciones={[
          { valor: '', texto: 'Seleccione una sala' },
          ...salas.map((sala) => ({ valor: sala.id, texto: sala.nombre })),
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <Campo
          etiqueta="Prefijo"
          placeholder="PC-SALA1-"
          maxLength={36}
          value={prefijo}
          onChange={(evento) => setPrefijo(evento.target.value)}
        />
        <Campo
          etiqueta="Desde"
          type="number"
          min={0}
          value={desde}
          onChange={(evento) => setDesde(evento.target.value)}
        />
        <Campo
          etiqueta="Hasta"
          type="number"
          min={0}
          value={hasta}
          onChange={(evento) => setHasta(evento.target.value)}
        />
        <Campo
          etiqueta="Dígitos"
          type="number"
          min={1}
          max={4}
          value={digitos}
          onChange={(evento) => setDigitos(evento.target.value)}
        />
      </div>

      <p className="text-sm text-texto-suave" aria-live="polite">
        {lote.problema
          ? lote.problema
          : lote.codigos.length
            ? `Se registrarán ${plural(lote.codigos.length, 'equipo', 'equipos')}: ${vistaPrevia(lote.codigos)}`
            : `Escriba un prefijo para ver los códigos (máximo ${MAXIMO_LOTE_EQUIPOS} por vez).`}
      </p>

      {error ? <Aviso tipo="error">{error}</Aviso> : null}

      <div>
        <Boton type="submit" cargando={cargando} disabled={!lote.codigos.length}>
          Registrar {lote.codigos.length ? plural(lote.codigos.length, 'equipo', 'equipos') : 'equipos'}
        </Boton>
      </div>

      {cargando ? (
        <p role="status" className="text-sm text-texto-suave">
          Registrando {progreso} de {lote.codigos.length}...
        </p>
      ) : null}

      {resultados.length ? (
        <div className="grid gap-2">
          <Aviso tipo={creados ? 'exito' : 'advertencia'}>
            {plural(creados, 'equipo registrado', 'equipos registrados')}
            {omitidos.length ? `; ${omitidos.length} omitidos` : ''}.{' '}
            <Link href={`/soporte?salaId=${salaId}`} className="font-semibold underline">
              Ver los equipos de la sala
            </Link>
          </Aviso>
          {omitidos.length ? (
            <ul className="grid gap-1 text-sm">
              {omitidos.map((r) => (
                <li key={r.codigo}>
                  <span className="font-semibold">{r.codigo}</span>:{' '}
                  <span className="text-baja">{r.mensaje}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
