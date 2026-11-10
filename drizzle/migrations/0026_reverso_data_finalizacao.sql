ALTER TABLE public.reversos ADD COLUMN IF NOT EXISTS data_finalizacao timestamptz;
CREATE OR REPLACE FUNCTION public.reverso_marcar_finalizacao() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'FINALIZADO' AND OLD.status IS DISTINCT FROM 'FINALIZADO' THEN NEW.data_finalizacao := now();
  ELSIF NEW.status <> 'FINALIZADO' THEN NEW.data_finalizacao := NULL; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS reverso_marcar_finalizacao ON public.reversos;
CREATE TRIGGER reverso_marcar_finalizacao BEFORE UPDATE OF status ON public.reversos FOR EACH ROW EXECUTE FUNCTION public.reverso_marcar_finalizacao();
UPDATE public.reversos r SET data_finalizacao = m.ultimo FROM (SELECT reverso_numero, max(criado_em) ultimo FROM public.reverso_movimentacoes WHERE status_novo = 'FINALIZADO' GROUP BY reverso_numero) m WHERE m.reverso_numero = r.numero AND r.status = 'FINALIZADO' AND r.data_finalizacao IS NULL;