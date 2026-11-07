import { Bloque, EsqueletoPagina, EsqueletoTarjetas } from '@/components/ui/Esqueleto';

// Panel: indicadores, gráfico con columna lateral, salas y tabla.
export default function CargandoPanel() {
  return (
    <EsqueletoPagina>
      <EsqueletoTarjetas cantidad={4} alto="h-32" columnas="grid-cols-2 lg:grid-cols-4" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Bloque className="h-80 lg:col-span-2" />
        <div className="grid gap-4">
          <Bloque className="h-32" />
          <Bloque className="h-44" />
        </div>
      </div>
      <EsqueletoTarjetas cantidad={3} alto="h-40" columnas="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" />
      <Bloque className="h-64" />
    </EsqueletoPagina>
  );
}
