ALTER TABLE public.chamados ADD COLUMN origem_solicitacao text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.chamados.origem_solicitacao IS 'Origem da solicitação: "Cliente entrou em contato" e/ou "Identificado internamente" (obrigatório na abertura).';