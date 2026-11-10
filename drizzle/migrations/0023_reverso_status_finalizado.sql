ALTER TABLE public.reversos ADD COLUMN IF NOT EXISTS finalizacao text;
CREATE OR REPLACE FUNCTION public.definir_status_reverso_v2(_numero bigint, _status text, _finalizacao text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR ((public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')) AND (public.tem_permissao(auth.uid(),'chamados') OR public.tem_permissao(auth.uid(),'reenvios'))))) THEN RAISE EXCEPTION 'Sem permissão para alterar reversos.'; END IF;
  IF _status IS NULL OR _status NOT IN ('NOVO REVERSO','REVERSO CONCLUÍDO','FINALIZADO') THEN RAISE EXCEPTION 'Status de reverso inválido.'; END IF;
  IF _status = 'FINALIZADO' AND (length(trim(coalesce(_finalizacao,''))) = 0 OR length(_finalizacao) > 1000) THEN RAISE EXCEPTION 'Para finalizar, preencha a descrição da finalização.'; END IF;
  UPDATE public.reversos SET status = _status, finalizacao = CASE WHEN _status = 'FINALIZADO' THEN trim(_finalizacao) ELSE finalizacao END WHERE numero = _numero;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reverso não encontrado.'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.definir_status_reverso_v2(bigint,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_status_reverso_v2(bigint,text,text) TO authenticated, service_role;