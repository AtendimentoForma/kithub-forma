// Mapeamento único dos IDs da Zendesk. Ajuste aqui sem mexer no resto do código.
// null = ainda não informado (o envio é bloqueado e o erro lista o que falta).
export const ZENDESK_CONFIG = {
  grupo: { nome: "E-mails KIT", id: null as number | null },
  marca: { nome: "FormaTurismo", id: null as number | null },
  formulario: { nome: "KIT", id: null as number | null },
  responsavel: { nome: "E-mail KIT", id: null as number | null }, // assignee (agente)
  campoMotivo: { nome: "Motivo da Solicitação - KIT", id: null as number | null, valor: "chamado_kithub" }, // valor = tag da opção
  campoDestino: { nome: "Destino", id: null as number | null }, // valor = tag da opção do destino (ver destinoTag)
};

// Converte o destino do KitHub na tag da opção do campo "Destino" (se o campo for lista).
export const DESTINO_TAG: Record<string, string> = {};

export function idsFaltando(): string[] {
  return Object.values(ZENDESK_CONFIG).filter((c) => c.id == null).map((c) => c.nome);
}
