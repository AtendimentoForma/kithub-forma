import { ZENDESK_CONFIG as Z, DESTINO_TAG, idsFaltando } from "./zendesk-config";

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
    group_id: Z.grupo.id, brand_id: Z.marca.id, ticket_form_id: Z.formulario.id, assignee_id: Z.responsavel.id,
    requester: { email: d.responsavelEmail, name: d.responsavel || d.responsavelEmail },
    via: { channel: "email" },
    custom_fields,
    comment: d.enviarEmail ? { body: d.emailTexto, public: true } : { body: d.notaInterna, public: false },
  };
  const res = await zd("/api/v2/tickets", {
    method: "POST", body: JSON.stringify({ ticket }),
    headers: { "Idempotency-Key": `kithub-chamado-${d.numero}` },
  });
  const id = res.ticket.id as number;
  if (d.enviarEmail) {
    await zd(`/api/v2/tickets/${id}`, { method: "PUT", body: JSON.stringify({ ticket: { comment: { body: d.notaInterna, public: false } } }) });
  }
  const sub = process.env["ZENDESK_SUBDOMAIN"];
  const url = typeof res.ticket.url === "string" && sub ? `https://${sub}.zendesk.com/agent/tickets/${id}` : String(res.ticket.url ?? "").replace("/api/v2/tickets/", "/agent/tickets/").replace(/\.json$/, "");
  return { id, url };
}
