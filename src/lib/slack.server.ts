// Aviso de novo chamado no Slack (canal #chamados-kits-viagens) via gateway de conectores.
// Arquivo *.server.ts: nunca chega ao bundle do navegador.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api/chat.postMessage";
const CANAL_CHAMADOS = "C0C8JFM4M6K"; // #chamados-kits-viagens

export type AvisoNovoChamado = {
  numero: number;
  solicitante: string;
  paxNome: string;
  paxId: string;
  idDelivery: string;
  destino: string;
  ano: string;
  motivos: string[];
  motivoOutro: string | null;
  motivoCorreios: string | null;
  origem: string;
  status: string;
};

export async function notificarNovoChamadoSlack(a: AvisoNovoChamado): Promise<void> {
  const chaveGateway = process.env["LOVABLE_API_KEY"];
  const chaveSlack = process.env["SLACK_API_KEY"];
  if (!chaveGateway || !chaveSlack) {
    console.warn("Slack: credenciais ausentes; aviso de novo chamado não enviado.");
    return;
  }
  const motivos = a.motivos.includes("Outro") && a.motivoOutro
    ? [...a.motivos.filter((m) => m !== "Outro"), `Outro: ${a.motivoOutro}`]
    : [...a.motivos];
  if (a.motivoCorreios && a.motivos.includes("Envio correios")) motivos.push(`Envio correios: ${a.motivoCorreios}`);
  const texto = [
    `:inbox_tray: *Novo chamado ${String(a.numero).padStart(5, "0")} — KitHub*`,
    `• Aberto por: ${a.solicitante}`,
    `• Passageiro: ${a.paxNome}`,
    `• ID Pax: ${a.paxId} | ID Delivery: ${a.idDelivery}`,
    `• Destino/Ano: ${a.destino} / ${a.ano}`,
    `• Motivo(s): ${motivos.join(", ")}`,
    `• Origem da solicitação: ${a.origem}`,
    `• Status: ${a.status}`,
  ].join("\n");
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${chaveGateway}`,
        "X-Connection-Api-Key": chaveSlack,
      },
      body: JSON.stringify({ channel: CANAL_CHAMADOS, text: texto }),
    });
    if (!res.ok) {
      const corpo = await res.text();
      console.error(`Slack chat.postMessage falhou [${res.status}]: ${corpo}`);
      return;
    }
    const dados = (await res.json()) as { ok?: boolean; error?: string };
    if (!dados.ok) console.error(`Slack chat.postMessage retornou erro: ${dados.error}`);
  } catch (erro) {
    console.error("Falha ao enviar aviso de novo chamado ao Slack:", erro);
  }
}
