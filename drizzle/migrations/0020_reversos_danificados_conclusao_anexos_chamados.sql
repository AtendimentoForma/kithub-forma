ALTER TABLE public.reversos ADD COLUMN objeto_danificado text;
ALTER TABLE public.reversos DROP CONSTRAINT reversos_motivos_check;
ALTER TABLE public.reversos ADD CONSTRAINT reversos_motivos_check CHECK (cardinality(motivos) BETWEEN 1 AND 4 AND motivos <@ ARRAY['Troca de tamanho','Defeito','Kit de outro destino','Objeto danificado']::text[]);
ALTER TABLE public.reversos ADD CONSTRAINT reversos_objeto_danificado_check CHECK (NOT ('Objeto danificado' = ANY(motivos)) OR length(trim(coalesce(objeto_danificado,''))) > 0);
ALTER TABLE public.chamados ADD COLUMN anexos_arquivos jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE OR REPLACE FUNCTION public.definir_status_reverso(_numero bigint, _status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR ((public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')) AND (public.tem_permissao(auth.uid(),'chamados') OR public.tem_permissao(auth.uid(),'reenvios'))))) THEN RAISE EXCEPTION 'Sem permissão para alterar reversos.'; END IF;
  IF _status NOT IN ('NOVO REVERSO','REVERSO CONCLUÍDO') OR _status IS NULL THEN RAISE EXCEPTION 'Status de reverso inválido.'; END IF;
  UPDATE public.reversos SET status = _status WHERE numero = _numero;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reverso não encontrado.'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.definir_status_reverso(bigint,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_status_reverso(bigint,text) TO authenticated, service_role;
CREATE POLICY chamados_anexos_leitura ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chamados-anexos' AND public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')));
CREATE POLICY chamados_anexos_envio ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chamados-anexos' AND (storage.foldername(name))[1] = auth.uid()::text AND public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')) AND (public.tem_permissao(auth.uid(),'chamados') OR public.tem_permissao(auth.uid(),'reenvios')));
CREATE POLICY chamados_anexos_limpeza ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chamados-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);