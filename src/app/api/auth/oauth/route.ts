import { NextResponse } from 'next/server';
import { COOKIE_SIGUIENTE, COOKIE_VERIFICADOR, proveedorOAuth, RUTA_VUELTA } from '@/lib/auth/oauth';
import { rutaSegura } from '@/lib/auth/redireccion';
import { createSupabaseOAuthClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DIEZ_MINUTOS = 60 * 10;

// Ida al proveedor (Microsoft o Google): Supabase arma la URL con el reto PKCE; el verificador
// queda en una cookie httpOnly hasta la vuelta (/api/auth/oauth/callback).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const proveedor = proveedorOAuth();
  if (!proveedor) return NextResponse.redirect(new URL('/login?oauth=no_configurado', url.origin));

  const memoria = new Map<string, string>();
  const { data, error } = await createSupabaseOAuthClient(memoria).auth.signInWithOAuth({
    provider: proveedor,
    options: {
      redirectTo: `${url.origin}${RUTA_VUELTA}`,
      skipBrowserRedirect: true,
      // Microsoft necesita pedir el correo; Google ofrece elegir la cuenta institucional.
      ...(proveedor === 'azure' ? { scopes: 'email' } : { queryParams: { prompt: 'select_account', hd: 'usa.edu.co' } }),
    },
  });
  const verificador = [...memoria.entries()].find(([clave]) => clave.endsWith('-code-verifier'))?.[1];
  if (error || !data.url || !verificador) {
    console.error('No se pudo iniciar el acceso institucional.', error);
    return NextResponse.redirect(new URL('/login?oauth=error', url.origin));
  }

  const respuesta = NextResponse.redirect(data.url);
  const opciones = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: DIEZ_MINUTOS,
    path: '/api/auth/oauth',
  };
  respuesta.cookies.set(COOKIE_VERIFICADOR, verificador, opciones);
  respuesta.cookies.set(COOKIE_SIGUIENTE, rutaSegura(url.searchParams.get('siguiente')), opciones);
  return respuesta;
}
