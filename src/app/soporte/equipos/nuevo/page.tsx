import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioEquipo } from '@/components/soporte/FormularioEquipo';
import { FormularioVariosEquipos } from '@/components/soporte/FormularioVariosEquipos';
import { MigaDePan } from '@/components/soporte/MigaDePan';
import { Aviso } from '@/components/ui/Aviso';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarSalas } from '@/lib/dataService';

export const metadata: Metadata = { title: 'Registrar equipo' };

type Props = { searchParams: Promise<{ salaId?: string | string[] }> };

export default async function PaginaNuevoEquipo({ searchParams }: Props) {
  const [salas, { salaId }] = await Promise.all([listarSalas(), searchParams]);
  const opciones = salas.map(({ id, nombre }) => ({ id, nombre }));
  // Solo se preselecciona una sala que exista.
  const salaInicial = opciones.some((s) => s.id === salaId) ? (salaId as string) : '';

  return (
    <>
      <MigaDePan pasos={[{ texto: 'Panel', href: '/soporte' }, { texto: 'Registrar equipo' }]} />
      <EncabezadoPagina
        etiqueta="Inventario"
        titulo="Registrar equipo"
        descripcion="Registre un equipo con su código o el inventario completo de una sala con códigos consecutivos. Todo equipo nuevo nace funcional."
      />
      {salas.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Tarjeta className="grid content-start gap-3">
            <div>
              <h2 className="font-bold">Un equipo</h2>
              <p className="text-sm text-texto-suave">
                Nace como funcional. Al guardarlo se abre su ficha.
              </p>
            </div>
            <FormularioEquipo salas={opciones} salaInicial={salaInicial} />
          </Tarjeta>
          <Tarjeta className="grid content-start gap-3">
            <div>
              <h2 className="font-bold">Varios equipos a la vez</h2>
              <p className="text-sm text-texto-suave">
                Para el inventario de una sala: genera códigos consecutivos con un prefijo.
              </p>
            </div>
            <FormularioVariosEquipos salas={opciones} salaInicial={salaInicial} />
          </Tarjeta>
        </div>
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
