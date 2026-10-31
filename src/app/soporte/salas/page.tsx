import { FormularioSala } from '@/components/soporte/FormularioSala';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarSalas } from '@/lib/dataService';

export default async function PaginaSalas() {
  const salas = await listarSalas();
  return (
    <>
      <h1 className="text-2xl font-bold">Salas</h1>
      <Tarjeta>
        <FormularioSala />
      </Tarjeta>
      {salas.length ? (
        <ul className="grid gap-2">
          {salas.map((sala) => (
            <li key={sala.id}>
              <Tarjeta className="flex items-center justify-between gap-4">
                <span className="font-semibold">{sala.nombre}</span>
                <span className="text-sm text-texto-suave">{sala.totalEquipos} equipos</span>
              </Tarjeta>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio titulo="Aún no hay salas" />
      )}
    </>
  );
}
