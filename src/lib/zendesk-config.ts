// Mapeamento único dos IDs da Zendesk. Ajuste aqui sem mexer no resto do código.
// null = ainda não informado (o envio é bloqueado e o erro lista o que falta).
export const ZENDESK_CONFIG = {
  grupo: { nome: "E-mails KIT", id: 360017007833 as number | null },
  marca: { nome: "FormaTurismo", id: 360006830733 as number | null },
  formulario: { nome: "KIT", id: 360006537653 as number | null },
  responsavel: { nome: "Agente (opcional)", id: null as number | null }, // opcional: o ticket fica atribuído à pasta/grupo "E-mails KIT"
  campoMotivo: { nome: "Motivo da Solicitação - KIT", id: 360054275194 as number | null, valor: null as string | null }, // valor = tag da opção
  campoDestino: { nome: "Destino", id: 360055228453 as number | null }, // valor = tag da opção do destino (ver destinoTag)
};

// Converte o destino do KitHub na tag da opção do campo "Destino" (se o campo for lista).
export const DESTINO_TAG: Record<string, string> = {
  "Floripa": "floripa",
  "Porto Seguro": "porto_seguro",
  "Club Med Rio": "club_med_rio",
  "Club Med São Paulo": "club_med_são_paulo",
  "Forfun": "forfun",
  "Caete": "caete",
  "Atibaia": "atibaia",
  "Malai Manso": "malai_manso",
  "Le Canton": "le_canton",
  "Novotel": "novotel",
  "Vila Gale Angra": "vila_gale_angra",
  "Beach Park": "beach_park",
  "Fazzenda Park": "fazzenda_park",
  "Pratagy": "pratagy",
  "Caldas da Imperatriz": "caldas_da_imperatriz",
  "Camp Cerrado": "camp_cerrado",
  "Camp SP": "camp_sp",
  "Camp Sul": "camp_sul",
  "Alexânia": "alexânia"
};

export function idsFaltando(): string[] {
  const f = Object.values(ZENDESK_CONFIG).filter((c) => c.id == null && c !== ZENDESK_CONFIG.responsavel).map((c) => c.nome);
  if (ZENDESK_CONFIG.campoMotivo.valor == null) f.push('opção "Chamado KitHub" do campo "Motivo da Solicitação - KIT"');
  return f;
}
