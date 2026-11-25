import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { criarTicketZendesk } from "./zendesk.server";

export type ResultadoZendesk = { ok: true; ticketId: number; ticketUrl: string; emailEnviado: boolean; jaEnviado?: boolean } | { ok: false; erro: string };

export async function enviarChamadoParaZendesk(sb: SupabaseClient<Database>, numero: number): Promise<ResultadoZendesk> {
  const { data: c, error } = await sb.from("chamados").select("*").eq("numero", numero).maybeSingle();
  if (error || !c) return { ok: false, erro: "Chamado não encontrado." };
  if (c.zendesk_ticket_id) return { ok: true, ticketId: c.zendesk_ticket_id, ticketUrl: c.zendesk_ticket_url ?? "", emailEnviado: c.zendesk_email_enviado, jaEnviado: true };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!c.responsavel_email || !c.destino) {
    const erro = "Chamado sem e-mail do responsável ou destino; corrija antes de enviar à Zendesk.";
    await supabaseAdmin.from("chamados").update({ zendesk_erro: erro }).eq("numero", numero);
    return { ok: false, erro };
  }
  const linhas = [
    `Chamado KitHub nº ${String(c.numero).padStart(5, "0")}`,
    `Aberto por: ${c.solicitante} em ${new Date(c.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    `Status: ${c.status}`,
    `Origem da solicitação: ${c.origem_solicitacao}`,
    `Motivo(s): ${c.motivos.join(", ")}`,
    c.motivo_outro && `Outro: ${c.motivo_outro}`,
    c.motivo_correios && `Envio correios: ${c.motivo_correios}`,
    c.coleta_status && `Coleta do pedido: ${c.coleta_status}`,
    `Passageiro: ${c.pax_nome}`, `CPF: ${c.cpf}`, `ID do Pax: ${c.pax_id}`, `ID Delivery: ${c.id_delivery ?? "—"}`,
    `Responsável: ${c.responsavel} <${c.responsavel_email}>`,
    `Destino: ${c.destino}`, `Ano: ${c.ano ?? "—"}`,
    `Envio / endereço: ${c.endereco}`, `Rastreio: ${c.rastreio}`, `Data do envio: ${c.data_envio}`,
    `Descrição / observação: ${c.observacao || "—"}`,
    c.anexos?.length ? `Anexos (no KitHub): ${c.anexos.join(", ")}` : null,
  ].filter(Boolean).join("\n");
  try {
    const t = await criarTicketZendesk({
      numero: c.numero, paxId: c.pax_id, responsavelEmail: c.responsavel_email, responsavel: c.responsavel, destino: c.destino,
      notaInterna: linhas, enviarEmail: c.enviar_email, emailTexto: c.email_texto,
    });
    await supabaseAdmin.from("chamados").update({
      zendesk_ticket_id: t.id, zendesk_ticket_url: t.url, zendesk_email_enviado: c.enviar_email, zendesk_erro: null, zendesk_enviado_em: new Date().toISOString(),
    }).eq("numero", numero);
    return { ok: true, ticketId: t.id, ticketUrl: t.url, emailEnviado: c.enviar_email };
  } catch (e) {
    const erro = e instanceof Error ? e.message : "Falha ao criar o ticket na Zendesk.";
    await supabaseAdmin.from("chamados").update({ zendesk_erro: erro }).eq("numero", numero);
    return { ok: false, erro };
  }
}
