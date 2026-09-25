CREATE OR REPLACE FUNCTION public.validar_pax_duplicado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _outro bigint;
BEGIN
  IF NEW.status <> 'CONCLUÍDO' THEN
    SELECT numero INTO _outro FROM public.chamados
     WHERE lower(trim(pax_id)) = lower(trim(NEW.pax_id))
       AND status <> 'CONCLUÍDO'
       AND numero IS DISTINCT FROM NEW.numero
     LIMIT 1;
    IF _outro IS NOT NULL THEN
      RAISE EXCEPTION 'Já existe o chamado #% em aberto para o ID do Pax %. Conclua-o antes de abrir ou reabrir outro.', lpad(_outro::text, 5, '0'), NEW.pax_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_validar_pax_duplicado
BEFORE INSERT OR UPDATE OF status, pax_id ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.validar_pax_duplicado();