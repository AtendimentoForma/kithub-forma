CREATE TABLE public.reverso_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reverso_numero bigint NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  autor_id uuid NOT NULL,
  autor_nome text NOT NULL DEFAULT '',
  perfil text NOT NULL DEFAULT '',
  status_anterior text,
  status_novo text NOT NULL,
  texto text
);
CREATE INDEX reverso_movimentacoes_numero_idx ON public.reverso_movimentacoes(reverso_numero, criado_em);
GRANT SELECT ON public.reverso_movimentacoes TO authenticated;
GRANT ALL ON public.reverso_movimentacoes TO service_role;
ALTER TABLE public.reverso_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY reverso_mov_leitura ON public.reverso_movimentacoes FOR SELECT TO authenticated
USING (public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')));

CREATE OR REPLACE FUNCTION public.definir_status_reverso_v2(_numero bigint, _status text, _finalizacao text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _atual text; _nome text; _perfil text;
BEGIN
  IF NOT (public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR ((public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')) AND (public.tem_permissao(auth.uid(),'chamados') OR public.tem_permissao(auth.uid(),'reenvios'))))) THEN RAISE EXCEPTION 'Sem permissão para alterar reversos.'; END IF;
  IF _status IS NULL OR _status NOT IN ('NOVO REVERSO','REVERSO CONCLUÍDO','FINALIZADO') THEN RAISE EXCEPTION 'Status de reverso inválido.'; END IF;
  IF _status = 'FINALIZADO' AND (length(trim(coalesce(_finalizacao,''))) = 0 OR length(_finalizacao) > 1000) THEN RAISE EXCEPTION 'Para finalizar, preencha a descrição da finalização.'; END IF;
  SELECT status INTO _atual FROM public.reversos WHERE numero = _numero FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reverso não encontrado.'; END IF;
  UPDATE public.reversos SET status = _status, finalizacao = CASE WHEN _status = 'FINALIZADO' THEN trim(_finalizacao) ELSE finalizacao END WHERE numero = _numero;
  IF _atual IS DISTINCT FROM _status THEN
    _perfil := CASE WHEN public.has_role(auth.uid(),'admin') THEN 'Admin' WHEN public.has_role(auth.uid(),'sac') THEN 'SAC' ELSE 'Lojinha' END;
    SELECT coalesce(nullif(nome,''), email, _perfil) INTO _nome FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.reverso_movimentacoes (reverso_numero, autor_id, autor_nome, perfil, status_anterior, status_novo, texto)
    VALUES (_numero, auth.uid(), coalesce(_nome,''), _perfil, _atual, _status, CASE WHEN _status = 'FINALIZADO' THEN trim(_finalizacao) END);
  END IF;
END; $function$;