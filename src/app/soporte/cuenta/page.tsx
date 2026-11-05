import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { obtenerSesion } from '@/lib/auth/sesion';

export const metadata: Metadata = { title: 'Mi cuenta' };

// Cambio de contraseña dentro del módulo (antes solo existía en la plantilla /change-password).
export default async function PaginaCuenta() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/login?siguiente=%2Fsoporte%2Fcuenta');
  return (
    <>
      <EncabezadoPagina
        etiqueta="Cuenta"
        titulo="Cambiar contraseña"
        descripcion={`Sesión iniciada como ${sesion.email}. La sesión dura 24 horas; al vencer se pide iniciar sesión de nuevo.`}
      />
      <Tarjeta className="max-w-2xl">
        <ChangePasswordForm email={sesion.email} />
      </Tarjeta>
    </>
  );
}
