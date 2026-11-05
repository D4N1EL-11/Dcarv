import { Bloque, EsqueletoPagina, EsqueletoTarjetas } from '@/components/ui/Esqueleto';

export default function CargandoSalas() {
  return (
    <EsqueletoPagina>
      <Bloque className="h-36" />
      <EsqueletoTarjetas cantidad={6} alto="h-48" columnas="sm:grid-cols-2 lg:grid-cols-3" />
    </EsqueletoPagina>
  );
}
