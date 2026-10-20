ALTER TABLE public.chamados ADD COLUMN motivo_correios text;
COMMENT ON COLUMN public.chamados.motivo_correios IS 'Texto obrigatório digitado quando o motivo do chamado é Envio correios';