ALTER TABLE public.chamados
  ADD COLUMN conf_dados boolean NOT NULL DEFAULT false,
  ADD COLUMN conf_envio boolean NOT NULL DEFAULT false,
  ADD COLUMN conf_motivo boolean NOT NULL DEFAULT false,
  ADD COLUMN requer_reenvio boolean,
  ADD COLUMN motivo_cancelamento text,
  ADD COLUMN requer_pagamento boolean,
  ADD COLUMN valor_frete numeric(10,2),
  ADD COLUMN status_pagamento text,
  ADD COLUMN novo_rastreio text,
  ADD COLUMN despachado_em timestamptz;

CREATE OR REPLACE FUNCTION public.despachar_chamado(_numero bigint, _rastreio text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare _st text;
begin
  if not (public.has_role(auth.uid(),'lojinha') or public.has_role(auth.uid(),'admin')) then
    raise exception 'Sem permissão.';
  end if;
  if coalesce(trim(_rastreio),'') = '' or length(_rastreio) > 100 then
    raise exception 'Informe o novo nº de rastreio.';
  end if;
  select status into _st from public.chamados where numero = _numero;
  if _st is distinct from 'REENVIO AUTORIZADO' then
    raise exception 'O reenvio ainda não foi autorizado.';
  end if;
  update public.chamados set novo_rastreio = trim(_rastreio), despachado_em = now() where numero = _numero;
  insert into public.chamado_movimentacoes (chamado_numero, autor_id, texto, status_novo)
  values (_numero, auth.uid(), 'Pedido despachado — novo rastreio: ' || trim(_rastreio), 'CONCLUÍDO');
end; $$;

REVOKE EXECUTE ON FUNCTION public.despachar_chamado(bigint, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.despachar_chamado(bigint, text) TO authenticated;