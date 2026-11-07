import type { Metadata } from 'next';
import { FormularioSala } from '@/components/soporte/FormularioSala';
import { ResumenSalas } from '@/components/soporte/ResumenSalas';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarSalas } from '@/lib/dataService';
import { plural, porcentaje } from '@/lib/formato';
import { soloSoporte } from '@/lib/auth/sesion';

export const metadata: Metadata = { title: 'Salas' };

export default async function PaginaSalas() {
  await soloSoporte();
  const salas = await listarSalas();
  const totalEquipos = salas.reduce((suma, sala) => suma + sala.totalEquipos, 0);
  const funcionales = salas.reduce((suma, sala) => suma + sala.funcionales, 0);
  return (
    <>
      <EncabezadoPagina
        etiqueta="Espacios"
        titulo="Salas"
        descripcion={
          <>
            {plural(salas.length, 'sala', 'salas')} con {plural(totalEquipos, 'equipo', 'equipos')} en
            total ({porcentaje(funcionales, totalEquipos)} % disponibles). El total de cada sala se
            calcula a partir de sus equipos registrados; una sala solo se puede eliminar si está vacía.
          </>
        }
      />
      {/* En pantallas anchas: formulario fijo a la izquierda y listado al lado. */}
      <div className="grid items-start gap-10 xl:grid-cols-[22rem_minmax(0,1fr)] xl:gap-8 2xl:grid-cols-[26rem_minmax(0,1fr)]">
        <Tarjeta className="grid gap-3 xl:sticky xl:top-24">
          <h2 className="text-xl font-medium">Registrar una sala</h2>
          <FormularioSala />
        </Tarjeta>
        <section aria-labelledby="titulo-lista-salas" className="grid gap-5">
          <TituloSeccion id="titulo-lista-salas" titulo="Salas registradas" />
          {salas.length ? (
            <ResumenSalas salas={salas} conRegistro />
          ) : (
            <EstadoVacio titulo="Aún no hay salas">
              Registre la primera con el formulario de arriba.
            </EstadoVacio>
          )}
        </section>
      </div>
    </>
  );
}
