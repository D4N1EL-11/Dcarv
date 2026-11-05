import { plural } from '@/lib/formato';
import { repartirPorcentajes } from '@/lib/reglas/estadisticas';

type Props = { funcionales: number; enReparacion: number; dadosDeBaja: number };

// Barra segmentada alta (un todo dividido en 3 partes): bloques con 2 px de separación, el
// porcentaje dentro del bloque cuando cabe, y una leyenda que nombra los estados en el mismo
// orden. Los conteos exactos están en los indicadores de arriba y en el nombre accesible.
export function BarraEstados({ funcionales, enReparacion, dadosDeBaja }: Props) {
  const valores = [funcionales, enReparacion, dadosDeBaja];
  const total = valores.reduce((a, b) => a + b, 0);
  const porcentajes = repartirPorcentajes(valores);
  const partes = [
    { nombre: 'Funcional', clase: 'bg-funcional', valor: funcionales, porcentaje: porcentajes[0]! },
    { nombre: 'En reparación', clase: 'bg-reparacion', valor: enReparacion, porcentaje: porcentajes[1]! },
    { nombre: 'Dado de baja', clase: 'bg-baja', valor: dadosDeBaja, porcentaje: porcentajes[2]! },
  ];
  const descripcion = partes.map((p) => `${p.nombre}: ${p.valor} (${p.porcentaje} %)`).join(', ');

  return (
    <div className="grid gap-3">
      <p className="text-sm text-texto-suave">{plural(total, 'equipo registrado', 'equipos registrados')}</p>
      {total ? (
        <div role="img" aria-label={`Estado del inventario. ${descripcion}`} className="flex h-7 gap-0.5">
          {partes
            .filter((p) => p.valor > 0)
            .map((p) => (
              <div
                key={p.nombre}
                title={`${p.nombre}: ${p.valor} (${p.porcentaje} %)`}
                className={`${p.clase} flex min-w-1 items-center overflow-hidden rounded px-2 text-xs font-semibold text-fondo`}
                style={{ flexGrow: p.valor, flexBasis: 0 }}
              >
                {p.porcentaje >= 10 ? `${p.porcentaje} %` : null}
              </div>
            ))}
        </div>
      ) : (
        <div className="h-7 rounded bg-borde" aria-label="Sin equipos registrados" role="img" />
      )}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave" aria-hidden="true">
        {partes.map((p) => (
          <li key={p.nombre} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${p.clase}`} />
            {p.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
