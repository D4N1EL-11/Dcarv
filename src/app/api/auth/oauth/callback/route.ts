import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ponerCookieSesion } from '@/lib/auth/acceso';
import { conContexto, fijarActor } from '@/lib/auth/contexto';
import { createToken } from '@/lib/auth/jwt';
import { COOKIE_SIGUIENTE, COOKIE_VERIFICADOR } from '@/lib/auth/oauth';
import { esRolValido, inicioPara, puedeSolicitarSoporte, ROL_INICIAL } from '@/lib/auth/permisos';
import { rutaSegura } from '@/lib/auth/redireccion';
import { prepararCuentaNueva, registrarIntento } from '@/lib/dataService';
import { createSupabaseAdminClient, createSupabaseOAuthClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function alLogin(origen: string, motivo: string): NextResponse {
  const respuesta = NextResponse.redirect(new URL(`/login?oauth=${motivo}`, origen));
  respuesta.cookies.delete({ name: COOKIE_VERIFICADOR, path: '/api/auth/oauth' });
  respuesta.cookies.delete({ name: COOKIE_SIGUIENTE, path: '/api/auth/oauth' });
  return respuesta;
}

// Vuelta del proveedor: se cambia el código por la identidad (PKCE), se exige el correo
// institucional y se abre la misma sesión firmada que usa el login con contraseña. La cuenta nueva
// nace como cuenta de reporte; como el proveedor ya verificó el correo institucional, queda con la
// solicitud de soporte abierta para que un administrador la apruebe (igual que el registro).
export function GET(request: Request) {
  return conContexto(() => volver(request));
}

async function volver(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  if (url.searchParams.get('error')) return alLogin(url.origin, 'cancelado');
  const codigo = url.searchParams.get('code');
  const almacen = await cookies();
  const verificador = almacen.get(COOKIE_VERIFICADOR)?.value;
  if (!codigo || !verificador) return alLogin(url.origin, 'error');

  try {
    const memoria = new Map([['dcarv-oauth-code-verifier', verificador]]);
    const { data, error } = await createSupabaseOAuthClient(memoria).auth.exchangeCodeForSession(codigo);
    const email = data.user?.email?.trim().toLowerCase();
    if (error || !data.user || !email) {
      console.error('No se pudo completar el acceso institucional.', error);
      return alLogin(url.origin, 'error');
    }
    if (!puedeSolicitarSoporte(email)) return alLogin(url.origin, 'dominio');

    // La fila de public.users la crea el disparador sync_auth_user al nacer la cuenta en Supabase.
    const admin = createSupabaseAdminClient();
    const { data: perfil } = await admin.from('users').select('id, email, role').eq('id', data.user.id).single();
    if (!perfil) return alLogin(url.origin, 'error');
    const rolGuardado = esRolValido(perfil.role) ? perfil.role : ROL_INICIAL;
    fijarActor({ id: perfil.id, email, rol: rolGuardado });
    await prepararCuentaNueva(perfil.id);
    await registrarIntento(email, true).catch((fallo: unknown) => console.error(fallo));

    const token = await createToken({ userId: perfil.id, email, role: rolGuardado });
    const pedida = almacen.get(COOKIE_SIGUIENTE)?.value;
    const destino = pedida && pedida !== '/soporte' ? rutaSegura(pedida) : inicioPara(rolGuardado);
    const respuesta = ponerCookieSesion(NextResponse.redirect(new URL(destino, url.origin)), token);
    respuesta.cookies.delete({ name: COOKIE_VERIFICADOR, path: '/api/auth/oauth' });
    respuesta.cookies.delete({ name: COOKIE_SIGUIENTE, path: '/api/auth/oauth' });
    return respuesta;
  } catch (fallo) {
    console.error('Fallo del acceso institucional.', fallo);
    return alLogin(url.origin, 'error');
  }
}
