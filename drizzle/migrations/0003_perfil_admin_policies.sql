DROP POLICY "Lojinha cria chamados" ON public.chamados;
CREATE POLICY "Lojinha e admin criam chamados" ON public.chamados FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'lojinha') OR public.has_role(auth.uid(),'admin')) AND solicitante_id = auth.uid() AND status = 'NOVO CHAMADO');

DROP POLICY "Lojinha e SAC veem chamados" ON public.chamados;
CREATE POLICY "Lojinha, SAC e admin veem chamados" ON public.chamados FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'lojinha') OR public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'admin'));

DROP POLICY "SAC atualiza chamados" ON public.chamados;
CREATE POLICY "SAC e admin atualizam chamados" ON public.chamados FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'admin'));

DROP POLICY "Lojinha e SAC veem movimentações" ON public.chamado_movimentacoes;
CREATE POLICY "Lojinha, SAC e admin veem movimentações" ON public.chamado_movimentacoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'lojinha') OR public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'admin'));

DROP POLICY "Lojinha e SAC registram movimentações" ON public.chamado_movimentacoes;
CREATE POLICY "Lojinha, SAC e admin registram movimentações" ON public.chamado_movimentacoes FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'lojinha') OR public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'admin')) AND autor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.aplicar_movimentacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare _atual text;
begin
  select status into _atual from public.chamados where numero = new.chamado_numero;
  new.perfil := case
    when public.has_role(new.autor_id,'admin') then 'Admin'
    when public.has_role(new.autor_id,'sac') then 'SAC'
    else 'Lojinha' end;
  select coalesce(nullif(nome,''), email, new.perfil) into new.autor_nome from public.profiles where id = new.autor_id;
  if new.status_novo is not null and new.status_novo <> _atual then
    new.status_anterior := _atual;
    update public.chamados set status = new.status_novo where numero = new.chamado_numero;
  else
    new.status_novo := null;
  end if;
  if new.status_novo is null and coalesce(trim(new.texto),'') = '' then
    raise exception 'Informe uma mensagem ou um novo status.';
  end if;
  return new;
end; $$;