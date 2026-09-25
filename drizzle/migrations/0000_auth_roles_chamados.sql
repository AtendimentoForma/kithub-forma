create type public.app_role as enum ('lojinha', 'sac');

create table public.profiles (
  id uuid primary key,
  nome text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Usuários autenticados veem perfis" on public.profiles for select to authenticated using (true);
create policy "Usuário atualiza o próprio perfil" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Usuário vê os próprios papéis" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare _perfil text := coalesce(new.raw_user_meta_data->>'perfil', 'lojinha');
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), new.email);
  if _perfil not in ('lojinha', 'sac') then _perfil := 'lojinha'; end if;
  insert into public.user_roles (user_id, role) values (new.id, _perfil::public.app_role);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.chamados (
  numero bigserial primary key,
  criado_em timestamptz not null default now(),
  solicitante_id uuid not null default auth.uid(),
  solicitante text not null default '',
  status text not null default 'NOVO CHAMADO',
  pax_nome text not null,
  cpf text not null,
  pax_id text not null,
  responsavel text not null,
  rastreio text not null,
  endereco text not null,
  data_envio date not null,
  motivos text[] not null default '{}',
  motivo_outro text,
  observacao text,
  anexos text[] not null default '{}'
);
grant select, insert, update on public.chamados to authenticated;
grant usage, select on sequence public.chamados_numero_seq to authenticated;
grant all on public.chamados to service_role;
alter table public.chamados enable row level security;
create policy "Lojinha e SAC veem chamados" on public.chamados for select to authenticated
  using (public.has_role(auth.uid(), 'lojinha') or public.has_role(auth.uid(), 'sac'));
create policy "Lojinha cria chamados" on public.chamados for insert to authenticated
  with check (public.has_role(auth.uid(), 'lojinha') and solicitante_id = auth.uid() and status = 'NOVO CHAMADO');
create policy "SAC atualiza chamados" on public.chamados for update to authenticated
  using (public.has_role(auth.uid(), 'sac'));