import { AGENTE_ASSINATURA_ID, TAG_CHAMADO, TAG_ENVIADO, ZENDESK_CONFIG as Z, DESTINO_TAG, idsFaltando, tagsDoTicket } from "./zendesk-config";

const GATEWAY = "https://connector-gateway.lovable.dev/zendesk";

function headers() {
  const a = process.env["LOVABLE_API_KEY"], b = process.env["ZENDESK_API_KEY"];
  if (!a || !b) throw new Error("Zendesk não está conectada ao KitHub.");
  return { Authorization: `Bearer ${a}`, "X-Connection-Api-Key": b, "Content-Type": "application/json" };
}

async function zd(path: string, init: RequestInit = {}) {
  const r = await fetch(`${GATEWAY}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  const txt = await r.text();
  if (!r.ok) { console.error(`Zendesk [${r.status}] ${path}: ${txt}`); throw new Error(`Zendesk recusou a criação do ticket (${r.status}): ${txt.slice(0, 300)}`); }
  return txt ? JSON.parse(txt) : {};
}

function textoParaHtml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>");
}

// A Zendesk já adiciona a assinatura da marca ao e-mail; o KitHub nunca a inclui.
// Proteção: se o texto digitado já terminar com a assinatura da marca, remove esse bloco final.
async function semAssinaturaFinal(texto: string): Promise<string> {
  try {
    const r = await zd(`/api/v2/brands/${Z.marca.id}`);
    const sig = String(r.brand?.signature_template ?? "").replace(/\{\{[^}]*\}\}/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
    const norm = (t: string) => t.replace(/\s+/g, " ").trim();
    if (sig && norm(texto).endsWith(norm(sig))) {
      const linhas = texto.trimEnd().split(/\r?\n/);
      for (let i = linhas.length - 1; i >= 0; i--) if (norm(linhas.slice(i).join("\n")) === norm(sig)) return linhas.slice(0, i).join("\n").trimEnd();
    }
  } catch (e) { console.error("Não foi possível conferir a assinatura da marca:", e); }
  return texto;
}

export function comentarioPublico(texto: string) {
  return { html_body: textoParaHtml(texto), public: true, ...(AGENTE_ASSINATURA_ID ? { author_id: AGENTE_ASSINATURA_ID } : {}) };
}

export async function prepararTextoEmail(texto: string): Promise<string> { return semAssinaturaFinal(texto.trim()); }

export type DadosTicket = {
  numero: number; paxId: string; responsavelEmail: string; responsavel: string; destino: string;
  notaInterna: string; enviarEmail: boolean; emailTexto: string | null;
};

export async function criarTicketZendesk(d: DadosTicket): Promise<{ id: number; url: string }> {
  const falta = idsFaltando();
  if (falta.length) throw new Error(`Configuração da Zendesk incompleta. Falta informar o ID de: ${falta.join(", ")}.`);
  const custom_fields = [
    { id: Z.campoMotivo.id, value: Z.campoMotivo.valor },
    { id: Z.campoDestino.id, value: DESTINO_TAG[d.destino] ?? d.destino },
  ];
  const ticket = {
    subject: `CHAMADO KITHUB - ${d.paxId}`,
    status: "pending", priority: "normal",
    group_id: Z.grupo.id, brand_id: Z.marca.id, ticket_form_id: Z.formulario.id, ...(Z.responsavel.id ? { assignee_id: Z.responsavel.id } : {}),
    requester: { email: d.responsavelEmail, name: d.responsavel || d.responsavelEmail },
    via: { channel: "email" },
    tags: tagsDoTicket(false),
    custom_fields,
    comment: { body: d.notaInterna, public: false },
  };
  const res = await zd("/api/v2/tickets", {
    method: "POST", body: JSON.stringify({ ticket }),
    headers: { "Idempotency-Key": `kithub-chamado-${d.numero}` },
  });
  const id = res.ticket.id as number;
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Zendesk não retornou o ID do ticket criado.");
  const url = `https://ajudaformaturismo.zendesk.com/agent/tickets/${id}`;
  return { id, url };
}

export async function enviarEmailTicketExistente(ticketId: number, texto: string): Promise<void> {
  // additional_tags é ignorado na atualização individual. Enviar tags com a união
  // das existentes no MESMO PUT do comentário, para o gatilho de e-mail enxergar a tag.
  const atual = await zd(`/api/v2/tickets/${ticketId}`);
  const existentes: unknown = atual.ticket?.tags;
  const updatedStamp: unknown = atual.ticket?.updated_at;
  if (!Array.isArray(existentes) || !existentes.every((tag): tag is string => typeof tag === "string") || typeof updatedStamp !== "string") {
    throw new Error("Não foi possível confirmar as tags atuais do ticket. Nenhum e-mail foi enviado.");
  }
  const tags = [...new Set([...existentes, TAG_CHAMADO, TAG_ENVIADO])];
  if (existentes.includes(TAG_ENVIADO)) throw new Error("O e-mail deste chamado já foi enviado.");
  await zd(`/api/v2/tickets/${ticketId}`, {
    method: "PUT",
    body: JSON.stringify({ ticket: { comment: comentarioPublico(texto), tags, safe_update: true, updated_stamp: updatedStamp } }),
  });
}
