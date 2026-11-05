import { Icono } from '@/components/ui/Icono';
import { evaluarContrasena, type NivelContrasena } from '@/lib/reglas/contrasena';

const COLOR: Record<NivelContrasena, string> = {
  0: 'bg-baja',
  1: 'bg-baja',
  2: 'bg-reparacion',
  3: 'bg-primario',
  4: 'bg-funcional',
};
const TEXTO: Record<NivelContrasena, string> = {
  0: 'text-baja',
  1: 'text-baja',
  2: 'text-reparacion',
  3: 'text-primario',
  4: 'text-funcional',
};

// Seguridad de la contraseña mientras se escribe: barra de 4 tramos, nivel en texto (no solo color)
// y la lista de lo que falta. Solo la longitud mínima es obligatoria; lo demás orienta.
export function MedidorContrasena({ clave, email = '' }: { clave: string; email?: string }) {
  if (!clave) return null;
  const { nivel, etiqueta, requisitos, consejo } = evaluarContrasena(clave, email);
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((tramo) => (
            <span
              key={tramo}
              className={`h-1 rounded-full transition-colors ${nivel >= tramo || (nivel === 0 && tramo === 1) ? COLOR[nivel] : 'bg-[var(--line)]'}`}
            />
          ))}
        </div>
        <span aria-live="polite" className={`text-xs font-medium ${TEXTO[nivel]}`}>
          <span className="sr-only">Seguridad de la contraseña: </span>
          {etiqueta}
        </span>
      </div>
      <ul className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
        {requisitos.map((requisito) => (
          <li
            key={requisito.texto}
            className={`flex items-center gap-1.5 text-xs ${requisito.cumple ? 'text-funcional' : 'text-[var(--text-secondary)]'}`}
          >
            <Icono nombre={requisito.cumple ? 'check' : 'cerrar'} className="size-3" />
            {requisito.texto}
            <span className="sr-only">{requisito.cumple ? ' (cumple)' : ' (falta)'}</span>
          </li>
        ))}
      </ul>
      {consejo ? <p className="text-xs text-baja">{consejo}</p> : null}
    </div>
  );
}
