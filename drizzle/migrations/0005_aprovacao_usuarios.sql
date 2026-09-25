ALTER TABLE public.profiles ADD COLUMN aprovado boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET aprovado = true;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ select exists (select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
  where r.user_id = _user_id and r.role = _role and p.aprovado) $$;

CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
 RETURNS TABLE(id uuid, nome text, email text, created_at timestamptz, aprovado boolean, papeis text[])
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Sem permissão.'; end if;
  return query select p.id, p.nome, p.email, p.created_at, p.aprovado,
    coalesce((select array_agg(r.role::text order by r.role) from public.user_roles r where r.user_id = p.id), '{}')
  from public.profiles p order by p.aprovado, p.created_at desc;
end; $$;

CREATE OR REPLACE FUNCTION public.admin_definir_usuario(_id uuid, _aprovado boolean, _papel app_role)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Sem permissão.'; end if;
  if _id = auth.uid() and (_papel <> 'admin' or not _aprovado) then
    raise exception 'Você não pode remover o seu próprio acesso de administrador.';
  end if;
  update public.profiles set aprovado = _aprovado where id = _id;
  delete from public.user_roles where user_id = _id;
  insert into public.user_roles (user_id, role) values (_id, _papel);
end; $$;

CREATE OR REPLACE FUNCTION public.meu_status_aprovacao()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ select coalesce((select aprovado from public.profiles where id = auth.uid()), false) $$;

GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_definir_usuario(uuid, boolean, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.meu_status_aprovacao() TO authenticated;