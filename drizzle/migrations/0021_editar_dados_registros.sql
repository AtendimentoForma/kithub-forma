CREATE OR REPLACE FUNCTION public.editar_dados_registro(_tipo text, _numero bigint, _patch jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _campo text; _permitidos text[]; _atual jsonb; _novo jsonb; _motivos text[]; _c public.chamados%ROWTYPE; _r public.reversos%ROWTYPE;
BEGIN
 IF NOT (public.meu_status_aprovacao() AND (public.has_role(auth.uid(),'admin') OR ((public.has_role(auth.uid(),'sac') OR public.has_role(auth.uid(),'lojinha')) AND (public.tem_permissao(auth.uid(),'chamados') OR public.tem_permissao(auth.uid(),'reenvios'))))) THEN RAISE EXCEPTION 'Sem permissão para editar informações.'; END IF;
 IF _tipo NOT IN ('chamado','reverso') OR _tipo IS NULL OR jsonb_typeof(_patch) IS DISTINCT FROM 'object' OR _patch='{}'::jsonb THEN RAISE EXCEPTION 'Alteração inválida.'; END IF;
 _permitidos := ARRAY['pax_nome','cpf','pax_id','id_delivery','responsavel','destino','ano','observacao','origem_solicitacao','motivos'];
 IF _tipo='chamado' THEN
  _permitidos := _permitidos || ARRAY['rastreio','data_envio','endereco','motivo_outro','motivo_correios','anexos','anexos_arquivos'];
  SELECT to_jsonb(c) INTO _atual FROM public.chamados c WHERE numero=_numero FOR UPDATE;
 ELSE
  _permitidos := _permitidos || ARRAY['autorizacao_mandae','rastreamento_mandae','kit_outro_destino','objeto_danificado','anexos'];
  SELECT to_jsonb(r) INTO _atual FROM public.reversos r WHERE numero=_numero FOR UPDATE;
 END IF;
 IF _atual IS NULL THEN RAISE EXCEPTION 'Registro não encontrado.'; END IF;
 FOR _campo IN SELECT jsonb_object_keys(_patch) LOOP
  IF NOT (_campo=ANY(_permitidos)) THEN RAISE EXCEPTION 'Este campo não pode ser alterado.'; END IF;
  IF _campo=ANY(ARRAY['pax_nome','cpf','pax_id','id_delivery','responsavel','destino','ano','rastreio','autorizacao_mandae','rastreamento_mandae','endereco']) AND (jsonb_typeof(_patch->_campo) IS DISTINCT FROM 'string' OR length(trim(coalesce(_patch->>_campo,'')))=0) THEN RAISE EXCEPTION 'Preencha o campo obrigatório.'; END IF;
  IF _campo='cpf' AND length(regexp_replace(_patch->>'cpf','[^0-9]','','g'))<>11 THEN RAISE EXCEPTION 'CPF deve ter 11 dígitos.'; END IF;
 END LOOP;
 _novo := _atual || _patch;
 SELECT array_agg(v) INTO _motivos FROM jsonb_array_elements_text(_novo->'motivos') v;
 IF _patch ? 'motivos' AND coalesce(cardinality(_motivos),0)=0 THEN RAISE EXCEPTION 'Selecione ao menos um motivo.'; END IF;
 IF _tipo='reverso' THEN
  IF (_patch ?| ARRAY['motivos','kit_outro_destino','objeto_danificado','anexos']) THEN
   IF 'Kit de outro destino'=ANY(_motivos) AND length(trim(coalesce(_novo->>'kit_outro_destino','')))=0 THEN RAISE EXCEPTION 'Descreva qual kit de qual destino foi recebido.'; END IF;
   IF 'Objeto danificado'=ANY(_motivos) AND length(trim(coalesce(_novo->>'objeto_danificado','')))=0 THEN RAISE EXCEPTION 'Descreva o que aconteceu com o objeto danificado.'; END IF;
  END IF;
  SELECT * INTO _r FROM jsonb_populate_record(NULL::public.reversos,_novo);
  UPDATE public.reversos SET pax_nome=_r.pax_nome,cpf=_r.cpf,pax_id=_r.pax_id,id_delivery=_r.id_delivery,responsavel=_r.responsavel,destino=_r.destino,ano=_r.ano,observacao=_r.observacao,origem_solicitacao=_r.origem_solicitacao,motivos=_r.motivos,autorizacao_mandae=_r.autorizacao_mandae,rastreamento_mandae=_r.rastreamento_mandae,kit_outro_destino=_r.kit_outro_destino,objeto_danificado=_r.objeto_danificado,anexos=_r.anexos WHERE numero=_numero;
 ELSE
  IF (_patch ?| ARRAY['motivos','motivo_outro','motivo_correios']) THEN
   IF 'Outro'=ANY(_motivos) AND length(trim(coalesce(_novo->>'motivo_outro','')))=0 THEN RAISE EXCEPTION 'Descreva o motivo Outro.'; END IF;
   IF 'Envio correios'=ANY(_motivos) AND length(trim(coalesce(_novo->>'motivo_correios','')))=0 THEN RAISE EXCEPTION 'Descreva o motivo do envio por correios.'; END IF;
  END IF;
  SELECT * INTO _c FROM jsonb_populate_record(NULL::public.chamados,_novo);
  UPDATE public.chamados SET pax_nome=_c.pax_nome,cpf=_c.cpf,pax_id=_c.pax_id,id_delivery=_c.id_delivery,responsavel=_c.responsavel,destino=_c.destino,ano=_c.ano,observacao=_c.observacao,origem_solicitacao=_c.origem_solicitacao,motivos=_c.motivos,rastreio=_c.rastreio,data_envio=_c.data_envio,endereco=_c.endereco,motivo_outro=_c.motivo_outro,motivo_correios=_c.motivo_correios,anexos=_c.anexos,anexos_arquivos=_c.anexos_arquivos WHERE numero=_numero;
  INSERT INTO public.chamado_movimentacoes(chamado_numero,autor_id,texto) VALUES (_numero,auth.uid(),'Correção de informações: ' || (SELECT string_agg(k,', ') FROM jsonb_object_keys(_patch) k));
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.editar_dados_registro(text,bigint,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.editar_dados_registro(text,bigint,jsonb) TO authenticated,service_role;