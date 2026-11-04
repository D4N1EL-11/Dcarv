import Link from 'next/link';
import { clasesBoton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';

export default function EquipoNoEncontrado() {
  return (
    <EstadoVacio titulo="No existe un equipo con ese código">
      <p>Revise el código o búsquelo en el panel.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link href="/soporte" className={clasesBoton()}>
          Ir al panel
        </Link>
        <Link href="/soporte/equipos/nuevo" className={clasesBoton('secundario')}>
          Registrar un equipo
        </Link>
      </div>
    </EstadoVacio>
  );
}
