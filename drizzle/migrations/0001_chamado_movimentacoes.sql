CREATE TABLE public.chamado_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_numero bigint NOT NULL REFERENCES public.chamados(numero) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  autor_id uuid NOT NULL DEFAULT auth.uid(),
  autor_nome text NOT NULL DEFAULT '',
  perfil text NOT NULL DEFAULT '',
  texto text,
  status_anterior text,
  status_novo text
);
CREATE INDEX ON public.chamado_movimentacoes (chamado_numero, criado_em);
GRANT SELECT, INSERT ON public.chamado_movimentacoes TO authenticated;
GRANT ALL ON public.chamado_movimentacoes TO service_role;
ALTER TABLE public.chamado_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lojinha e SAC veem movimentações" ON public.chamado_movimentacoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'lojinha') OR public.has_role(auth.uid(),'sac'));
CREATE POLICY "Lojinha e SAC registram movimentações" ON public.chamado_movimentacoes FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'lojinha') OR public.has_role(auth.uid(),'sac')) AND autor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.aplicar_movimentacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare _atual text;
begin
  select status into _atual from public.chamados where numero = new.chamado_numero;
  new.perfil := case when public.has_role(new.autor_id,'sac') then 'SAC' else 'Lojinha' end;
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
CREATE TRIGGER trg_aplicar_movimentacao BEFORE INSERT ON public.chamado_movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.aplicar_movimentacao();