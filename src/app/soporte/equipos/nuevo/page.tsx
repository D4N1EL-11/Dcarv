import Link from 'next/link';
import { FormularioEquipo } from '@/components/soporte/FormularioEquipo';
import { Aviso } from '@/components/ui/Aviso';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarSalas } from '@/lib/dataService';

export default async function PaginaNuevoEquipo() {
  const salas = await listarSalas();
  return (
    <>
      <h1 className="text-2xl font-bold">Registrar equipo</h1>
      {salas.length ? (
        <Tarjeta>
          <FormularioEquipo salas={salas.map(({ id, nombre }) => ({ id, nombre }))} />
        </Tarjeta>
      ) : (
        <Aviso tipo="advertencia">
          Primero registre una sala en{' '}
          <Link href="/soporte/salas" className="font-semibold underline">
            Salas
          </Link>
          .
        </Aviso>
      )}
    </>
  );
}
