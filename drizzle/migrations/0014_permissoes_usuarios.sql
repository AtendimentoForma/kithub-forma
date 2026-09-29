CREATE TYPE public.app_permissao AS ENUM ('consulta','chamados','reenvios','pagamentos');

CREATE TABLE public.user_permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permissao public.app_permissao NOT NULL,
  UNIQUE (user_id, permissao)
);

GRANT SELECT ON public.user_permissoes TO authenticated;
GRANT ALL ON public.user_permissoes TO service_role;

ALTER TABLE public.user_permissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve suas permissoes" ON public.user_permissoes
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

INSERT INTO public.user_permissoes (user_id, permissao)
SELECT p.id, 'chamados'::public.app_permissao FROM public.profiles p
ON CONFLICT DO NOTHING;

INSERT INTO public.user_permissoes (user_id, permissao)
SELECT r.user_id, v.perm FROM public.user_roles r
CROSS JOIN (VALUES ('consulta'::public.app_permissao),('reenvios'::public.app_permissao),('pagamentos'::public.app_permissao)) AS v(perm)
WHERE r.role IN ('sac','admin')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.tem_permissao(_user_id uuid, _perm public.app_permissao)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ select public.has_role(_user_id,'admin') or exists (
  select 1 from public.user_permissoes up join public.profiles p on p.id = up.user_id
  where up.user_id = _user_id and up.permissao = _perm and p.aprovado) $$;

CREATE OR REPLACE FUNCTION public.minhas_permissoes()
 RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ select coalesce((select array_agg(permissao::text order by permissao::text)
  from public.user_permissoes where user_id = auth.uid()), '{}') $$;

CREATE OR REPLACE FUNCTION public.admin_listar_usuarios_v2()
 RETURNS TABLE(id uuid, nome text, email text, created_at timestamptz, aprovado boolean, papeis text[], permissoes text[])
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Sem permissão.'; end if;
  return query select p.id, p.nome, p.email, p.created_at, p.aprovado,
    coalesce((select array_agg(r.role::text order by r.role) from public.user_roles r where r.user_id = p.id), '{}'),
    coalesce((select array_agg(up.permissao::text order by up.permissao::text) from public.user_permissoes up where up.user_id = p.id), '{}')
  from public.profiles p order by p.aprovado, p.created_at desc;
end; $$;

CREATE OR REPLACE FUNCTION public.admin_definir_usuario_v2(_id uuid, _aprovado boolean, _papel app_role, _permissoes text[])
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare _p text;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Sem permissão.'; end if;
  if _id = auth.uid() and (_papel <> 'admin' or not _aprovado) then
    raise exception 'Você não pode remover o seu próprio acesso de administrador.';
  end if;
  update public.profiles set aprovado = _aprovado where id = _id;
  delete from public.user_roles where user_id = _id;
  insert into public.user_roles (user_id, role) values (_id, _papel);
  delete from public.user_permissoes where user_id = _id;
  foreach _p in array coalesce(_permissoes, '{}')
  loop
    insert into public.user_permissoes (user_id, permissao) values (_id, _p::public.app_permissao)
    on conflict do nothing;
  end loop;
end; $$;

GRANT EXECUTE ON FUNCTION public.minhas_permissoes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tem_permissao(uuid, public.app_permissao) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_definir_usuario_v2(uuid, boolean, app_role, text[]) TO authenticated;