import { PanelAlertas } from '@/components/soporte/PanelAlertas';
import { listarCandidatosABaja } from '@/lib/dataService';

export default async function PaginaAlertas() {
  return (
    <>
      <h1 className="text-2xl font-bold">Alertas</h1>
      <p className="text-sm text-texto-suave">
        Equipos con 3 o más incidencias en los últimos 30 días.
      </p>
      <PanelAlertas candidatos={await listarCandidatosABaja()} />
    </>
  );
}
