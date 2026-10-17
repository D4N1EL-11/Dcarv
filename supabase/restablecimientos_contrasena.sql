create table if not exists public.restablecimientos_contrasena (
	id uuid primary key default gen_random_uuid(),
	usuario_id uuid not null references public.users (id) on delete cascade,
	token_hash text not null unique,
	expira_en timestamptz not null,
	usado_en timestamptz,
	creado_en timestamptz not null default now()
);

create index if not exists restablecimientos_contrasena_usuario_id_idx
	on public.restablecimientos_contrasena (usuario_id);

alter table public.restablecimientos_contrasena enable row level security;
revoke all on table public.restablecimientos_contrasena from anon, authenticated;
grant all on table public.restablecimientos_contrasena to service_role;

create or replace function public.contar_solicitudes_restablecimiento(p_usuario_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
	select count(*)
	from public.restablecimientos_contrasena
	where usuario_id = p_usuario_id
	  and creado_en >= pg_catalog.now() - interval '15 minutes';
$$;

create or replace function public.invalidar_tokens_restablecimiento(p_usuario_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
	update public.restablecimientos_contrasena
	set usado_en = pg_catalog.now()
	where usuario_id = p_usuario_id and usado_en is null;
$$;

create or replace function public.buscar_token_restablecimiento(p_token_hash text)
returns table (id uuid, usuario_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
	select restablecimiento.id, restablecimiento.usuario_id
	from public.restablecimientos_contrasena as restablecimiento
	where restablecimiento.token_hash = p_token_hash
	  and restablecimiento.usado_en is null
	  and restablecimiento.expira_en > pg_catalog.now()
	limit 1;
$$;

create or replace function public.marcar_token_restablecimiento_usado(p_token_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
	filas_actualizadas integer;
begin
	update public.restablecimientos_contrasena
	set usado_en = pg_catalog.now()
	where id = p_token_id
	  and usado_en is null
	  and expira_en > pg_catalog.now();
	get diagnostics filas_actualizadas = row_count;
	return filas_actualizadas > 0;
end;
$$;

revoke all on function public.contar_solicitudes_restablecimiento(uuid) from public, anon, authenticated;
revoke all on function public.invalidar_tokens_restablecimiento(uuid) from public, anon, authenticated;
revoke all on function public.buscar_token_restablecimiento(text) from public, anon, authenticated;
revoke all on function public.marcar_token_restablecimiento_usado(uuid) from public, anon, authenticated;
grant execute on function public.contar_solicitudes_restablecimiento(uuid) to service_role;
grant execute on function public.invalidar_tokens_restablecimiento(uuid) to service_role;
grant execute on function public.buscar_token_restablecimiento(text) to service_role;
grant execute on function public.marcar_token_restablecimiento_usado(uuid) to service_role;