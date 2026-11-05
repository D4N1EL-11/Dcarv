import { Bloque, EsqueletoPagina, EsqueletoTarjetas } from '@/components/ui/Esqueleto';

export default function CargandoEquipo() {
  return (
    <EsqueletoPagina>
      <Bloque className="h-40" />
      <div className="ml-2 grid gap-4 border-l border-borde pl-6">
        <EsqueletoTarjetas cantidad={3} alto="h-28" columnas="grid-cols-1" />
      </div>
    </EsqueletoPagina>
  );
}
