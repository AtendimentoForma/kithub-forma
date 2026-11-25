ALTER TABLE public.chamados
  ADD COLUMN IF NOT EXISTS responsavel_email text,
  ADD COLUMN IF NOT EXISTS enviar_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_texto text,
  ADD COLUMN IF NOT EXISTS zendesk_ticket_id bigint,
  ADD COLUMN IF NOT EXISTS zendesk_ticket_url text,
  ADD COLUMN IF NOT EXISTS zendesk_email_enviado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zendesk_erro text,
  ADD COLUMN IF NOT EXISTS zendesk_enviado_em timestamptz;