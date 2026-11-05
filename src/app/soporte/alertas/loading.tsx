import { EsqueletoPagina, EsqueletoTarjetas } from '@/components/ui/Esqueleto';

export default function CargandoAlertas() {
  return (
    <EsqueletoPagina>
      <EsqueletoTarjetas cantidad={3} alto="h-28" columnas="grid-cols-1" />
    </EsqueletoPagina>
  );
}
