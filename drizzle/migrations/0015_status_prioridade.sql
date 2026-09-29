CREATE OR REPLACE FUNCTION public.aplicar_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare _atual text;
begin
  select status into _atual from public.chamados where numero = new.chamado_numero;
  new.perfil := case
    when public.has_role(new.autor_id,'admin') then 'Admin'
    when public.has_role(new.autor_id,'sac') then 'SAC'
    else 'Lojinha' end;
  select coalesce(nullif(nome,''), email, new.perfil) into new.autor_nome from public.profiles where id = new.autor_id;
  if new.status_novo = 'ANÁLISE LIDERANÇA' then
    if not (public.has_role(new.autor_id,'sac') or public.has_role(new.autor_id,'admin')) then
      raise exception 'Somente o SAC pode usar o status ANÁLISE LIDERANÇA.';
    end if;
    if coalesce(trim(new.texto),'') = '' then
      raise exception 'Para marcar como "ANÁLISE LIDERANÇA", escreva uma observação.';
    end if;
  end if;
  if new.status_novo = 'PRIORIDADE DE ENTREGA' and new.status_novo is distinct from _atual
     and not (public.has_role(new.autor_id,'sac') or public.has_role(new.autor_id,'admin')) then
    raise exception 'Somente o SAC pode usar o status PRIORIDADE DE ENTREGA.';
  end if;
  if new.status_novo = 'PRIORIDADE FINALIZADA' and new.status_novo is distinct from _atual
     and not (public.has_role(new.autor_id,'lojinha') or public.has_role(new.autor_id,'admin')) then
    raise exception 'Somente a Lojinha pode usar o status PRIORIDADE FINALIZADA.';
  end if;
  if new.status_novo is not null and new.status_novo <> _atual then
    new.status_anterior := _atual;
    update public.chamados set status = new.status_novo where numero = new.chamado_numero;
  else
    new.status_novo := null;
  end if;
  if new.status_novo is null and coalesce(trim(new.texto),'') = '' then
    raise exception 'Informe uma mensagem ou um novo status.';
  end if;
  return new;
end; $function$;