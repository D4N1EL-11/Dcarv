'use client';

import { usePathname } from 'next/navigation';

// Cada página entra con una animación breve. La clave es solo la ruta: los refrescos tras una
// acción (misma ruta, otro ?v=) no vuelven a animar ni reinician el estado de los formularios.
export function TransicionPagina({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  return (
    <div key={ruta} className="grid animate-entrada content-start gap-10">
      {children}
    </div>
  );
}
