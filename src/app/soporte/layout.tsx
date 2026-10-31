import { redirect } from 'next/navigation';
import { NavegacionSoporte } from '@/components/soporte/NavegacionSoporte';
import { obtenerSesion } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export default async function LayoutSoporte({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login');
  return (
    <div className="relative min-h-screen bg-fondo text-texto">
      <NavegacionSoporte email={sesion.email} />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
