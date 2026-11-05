import { Bloque, EsqueletoPagina, EsqueletoTarjetas } from '@/components/ui/Esqueleto';

export default function CargandoIncidencias() {
  return (
    <EsqueletoPagina>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Bloque key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      <Bloque className="h-16" />
      <EsqueletoTarjetas cantidad={5} alto="h-28" columnas="grid-cols-1" />
    </EsqueletoPagina>
  );
}
