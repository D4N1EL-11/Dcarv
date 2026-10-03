create table if not exists public.users (
	id uuid primary key references auth.users (id) on delete cascade,
	email text not null unique,
	role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;
grant select on table public.users to authenticated;

drop policy if exists users_select_own on public.users;
create policy users_select_own
	on public.users
	for select
	to authenticated
	using ((select auth.uid()) = id);

create or replace function public.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	insert into public.users (id, email)
	values (new.id, new.email)
	on conflict (id) do update
	set email = excluded.email,
		updated_at = now();
	return new;
end;
$$;

drop trigger if exists on_auth_user_created_or_updated on auth.users;
create trigger on_auth_user_created_or_updated
	after insert or update of email on auth.users
	for each row execute function public.sync_auth_user();

insert into public.users (id, email)
select id, email
from auth.users
where email is not null
on conflict (id) do update
set email = excluded.email,
	updated_at = now();