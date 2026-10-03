import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
	process.env.NEXT_PUBLIC_Dcarv_DCARVSUPABASE_URL ??
	process.env.Dcarv_SUPABASE_URL ??
	process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
	process.env.NEXT_PUBLIC_Dcarv_DCARVSUPABASE_PUBLISHABLE_KEY ??
	process.env.NEXT_PUBLIC_Dcarv_DCARVSUPABASE_ANON_KEY ??
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceKey =
	process.env.Dcarv_SUPABASE_SERVICE_ROLE_KEY ??
	process.env.Dcarv_SUPABASE_SECRET_KEY ??
	process.env.SUPABASE_SERVICE_ROLE_KEY ??
	process.env.SUPABASE_SECRET_KEY;

export function createSupabaseServerClient(accessToken?: string) {
	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Falta configurar la URL o la clave pública de Supabase.');
	}

	return createClient(supabaseUrl, supabaseKey, {
		...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	});
}

export function createSupabaseAdminClient() {
	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error('Falta configurar las credenciales privadas de Supabase en el servidor.');
	}

	return createClient(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	});
}