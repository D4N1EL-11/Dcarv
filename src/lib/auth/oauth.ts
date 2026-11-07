// Inicio de sesión con la cuenta institucional (Microsoft o Google) a través de Supabase Auth.
// Se activa con NEXT_PUBLIC_OAUTH_PROVEEDOR = 'azure' | 'google' y el proveedor habilitado en
// Supabase (Authentication → Providers) con la URL de vuelta /api/auth/oauth/callback permitida.
// Módulo puro: lo usan el botón del login (navegador) y las rutas (servidor).

export type ProveedorOAuth = 'azure' | 'google';

export const NOMBRE_PROVEEDOR: Record<ProveedorOAuth, string> = {
  azure: 'Microsoft',
  google: 'Google',
};

export function proveedorOAuth(): ProveedorOAuth | null {
  const valor = process.env.NEXT_PUBLIC_OAUTH_PROVEEDOR?.trim();
  return valor === 'azure' || valor === 'google' ? valor : null;
}

export const COOKIE_VERIFICADOR = 'dcarv_oauth_verificador';
export const COOKIE_SIGUIENTE = 'dcarv_oauth_siguiente';
export const RUTA_VUELTA = '/api/auth/oauth/callback';

// Mensajes del login según ?oauth= (la vuelta del proveedor nunca muestra el error técnico).
export const MENSAJES_OAUTH: Record<string, string> = {
  no_configurado: 'El inicio de sesión institucional no está disponible en este momento.',
  cancelado: 'Se canceló el inicio de sesión con la cuenta institucional.',
  dominio: 'Use su cuenta institucional (@usa.edu.co) para entrar con este botón.',
  error: 'No se pudo iniciar sesión con la cuenta institucional. Intente de nuevo.',
};
