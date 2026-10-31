import { FormularioTecnico } from '@/components/soporte/FormularioTecnico';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { listarTecnicos } from '@/lib/dataService';

export default async function PaginaTecnicos() {
  const tecnicos = await listarTecnicos();
  return (
    <>
      <h1 className="text-2xl font-bold">Técnicos</h1>
      <Tarjeta>
        <FormularioTecnico />
      </Tarjeta>
      {tecnicos.length ? (
        <ul className="grid gap-2">
          {tecnicos.map((tecnico) => (
            <li key={tecnico.id}>
              <Tarjeta className="flex items-center justify-between gap-4">
                <span className="font-semibold">{tecnico.nombre}</span>
                <span className="text-sm text-texto-suave">{tecnico.enRevision} en revisión</span>
              </Tarjeta>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio titulo="Aún no hay técnicos" />
      )}
    </>
  );
}
