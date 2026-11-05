import { Bloque, EsqueletoPagina, EsqueletoTarjetas } from '@/components/ui/Esqueleto';

export default function CargandoTecnicos() {
  return (
    <EsqueletoPagina>
      <Bloque className="h-36" />
      <EsqueletoTarjetas cantidad={4} alto="h-32" columnas="sm:grid-cols-2" />
    </EsqueletoPagina>
  );
}
