import type { Metadata } from 'next';
import { FormularioSala } from '@/components/soporte/FormularioSala';
import { ResumenSalas } from '@/components/soporte/ResumenSalas';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarSalas } from '@/lib/dataService';
import { plural } from '@/lib/formato';

export const metadata: Metadata = { title: 'Salas' };

export default async function PaginaSalas() {
  const salas = await listarSalas();
  const totalEquipos = salas.reduce((suma, sala) => suma + sala.totalEquipos, 0);
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Salas</h1>
        <p className="text-sm text-texto-suave">
          {plural(salas.length, 'sala', 'salas')} con {plural(totalEquipos, 'equipo', 'equipos')}{' '}
          en total. El total de cada sala se calcula a partir de sus equipos registrados.
        </p>
      </div>
      <Tarjeta className="grid gap-2">
        <h2 className="font-bold">Registrar una sala</h2>
        <FormularioSala />
      </Tarjeta>
      {salas.length ? (
        <ResumenSalas salas={salas} conRegistro />
      ) : (
        <EstadoVacio titulo="Aún no hay salas">
          Registre la primera con el formulario de arriba.
        </EstadoVacio>
      )}
    </>
  );
}
