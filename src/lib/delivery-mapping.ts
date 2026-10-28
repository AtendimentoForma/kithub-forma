import { UF_PARA_ESTADO } from "./endereco";

export const DESTINO_DELIVERY_PARA_KITHUB: Record<number, string> = {
  54: "Floripa", 55: "Porto Seguro", 21: "Club Med Rio", 119: "Club Med São Paulo",
  124: "Forfun", 153: "Forfun", 156: "Forfun", 163: "Forfun", 107: "Caete",
  72: "Atibaia", 165: "Malai Manso", 115: "Le Canton", 159: "Novotel",
  160: "Vila Gale Angra", 105: "Beach Park", 168: "Pratagy", 162: "Camp Cerrado",
  101: "Camp SP", 128: "Camp Sul", 164: "Alexânia",
};
export const DELIVERY_TIMEOUT_MS = 10_000;
export const validarIdDelivery = (id: unknown): id is string => typeof id === "string" && /^\d{1,12}$/.test(id);
export type AvisoDelivery = { campo: string; codigo: string; mensagem: string; valorOriginal?: number };
export type CamposDelivery = Partial<Record<"paxNome" | "cpf" | "paxId" | "idDelivery" | "responsavel" | "destino", string>> & { endereco?: Partial<Record<"cep" | "logradouro" | "numero" | "complemento" | "bairro" | "cidade" | "estado", string>> };
export type SucessoDelivery = {
  ok: true;
  pedido: { idDelivery?: string; provedor?: string; statusTransmissao?: string };
  campos: CamposDelivery;
  sugestoes: { tipoEnvio?: "Dados do envio original"; dataTransmissao?: string; urlRastreio?: string; observacaoDelivery?: string };
  avisos: AvisoDelivery[];
};
export type ResultadoDelivery = SucessoDelivery | { ok: false; codigo: string; mensagem: string };
export function registro(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
}
const texto = (v: unknown) => typeof v === "string" ? v.trim() : "";
const identificador = (v: unknown) => typeof v === "string" ? v.trim() : typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? String(v) : "";
export function urlSegura(v: unknown): string | undefined {
  if (typeof v !== "string" || v.length > 2048) return;
  try { const url = new URL(v); if (url.protocol === "https:" && !url.username && !url.password) return url.href; } catch { /* URL inválida não é exposta. */ }
  return undefined;
}

export function mapearPedidoDelivery(valor: unknown): SucessoDelivery {
  const p = registro(valor);
  const campos: CamposDelivery = {};
  const avisos: AvisoDelivery[] = [];
  const sugestoes: SucessoDelivery["sugestoes"] = {};
  const aviso = (campo: string, codigo: string, mensagem: string, valorOriginal?: number) => {
    avisos.push({ campo, codigo, mensagem, ...(valorOriginal === undefined ? {} : { valorOriginal }) });
  };
  const validarTexto = (campo: string, valor: unknown, max: number, opcional = false) => {
    const v = texto(valor);
    if (!v) { if (!opcional) aviso(campo, "VAZIO", "Não informado pelo Delivery. Preencha manualmente."); return; }
    if (v.length > max) { aviso(campo, "COMPRIMENTO_EXCEDIDO", `Delivery enviou mais de ${max} caracteres. Preencha manualmente.`); return; }
    return v;
  };
  for (const [campo, origem] of [["paxNome", "nomeDestinatario"], ["responsavel", "nomeNotaFiscal"]] as const) {
    const v = validarTexto(campo, p[origem], 255); if (v) campos[campo] = v;
  }
  for (const [campo, origem] of [["paxId", "idPax"], ["idDelivery", "id"]] as const) {
    const v = identificador(p[origem]);
    if (!v) aviso(campo, "VAZIO", "Não informado pelo Delivery. Preencha manualmente.");
    else if (v.length > 255) aviso(campo, "COMPRIMENTO_EXCEDIDO", "Identificador muito longo. Preencha manualmente.");
    else campos[campo] = v;
  }
  const cpfOriginal = identificador(p["cpfNotaFiscal"]);
  const cpf = cpfOriginal.replace(/\D/g, "").padStart(11, "0");
  if (cpfOriginal && /\d/.test(cpfOriginal) && /^\d{11}$/.test(cpf)) campos.cpf = cpf;
  else aviso("cpf", "CPF_INVALIDO", "CPF inválido no Delivery. Preencha manualmente.");

  const nomes = new Set<string>();
  let desconhecido = false;
  const itens = Array.isArray(p["produtosPedidoEntrega"]) ? p["produtosPedidoEntrega"] : [];
  for (const item of itens) {
    const id = registro(registro(item)["brinde"])["destinoId"];
    if (id === null || id === undefined) continue;
    const chave = typeof id === "number" ? id : typeof id === "string" && /^\d+$/.test(id) ? Number(id) : NaN;
    const nome = DESTINO_DELIVERY_PARA_KITHUB[chave];
    if (nome) nomes.add(nome);
    else { desconhecido = true; aviso("destino", "DESTINO_NAO_MAPEADO", `Destino ${Number.isSafeInteger(chave) ? chave : "desconhecido"} não tem equivalente no KitHub: selecione manualmente.`, Number.isSafeInteger(chave) ? chave : undefined); }
  }
  if (nomes.size > 1) aviso("destino", "DESTINO_MULTIPLO", "O pedido contém destinos diferentes. Selecione manualmente.");
  else if (!desconhecido && nomes.size === 1) { const nome = [...nomes][0]; if (nome) campos.destino = nome; }
  else if (!desconhecido) aviso("destino", "DESTINO_NAO_MAPEADO", "O pedido não informa um destino equivalente. Selecione manualmente.");

  const essenciais = ["logradouro", "cep", "bairro", "numero", "cidade", "uf"];
  const presente = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";
  if (essenciais.some(k => presente(p[k]))) {
    const end: NonNullable<CamposDelivery["endereco"]> = {};
    const cepOriginal = identificador(p["cep"]);
    const cep = cepOriginal.padStart(8, "0");
    if (cepOriginal && /^\d{8}$/.test(cep)) end.cep = cep;
    else aviso("cep", "CEP_INVALIDO", "CEP inválido no Delivery. Preencha manualmente.");
    for (const [campo, max] of [["logradouro", 80], ["numero", 20], ["complemento", 60], ["bairro", 40], ["cidade", 40]] as const) {
      const v = validarTexto(campo, p[campo], max, campo === "complemento"); if (v) end[campo] = v;
    }
    const estado = UF_PARA_ESTADO[texto(p["uf"]).toUpperCase()];
    if (estado) end.estado = estado;
    else aviso("estado", "UF_INVALIDA", "Estado inválido no Delivery. Selecione manualmente.");
    if (essenciais.every(k => presente(p[k]))) { campos.endereco = end; sugestoes.tipoEnvio = "Dados do envio original"; }
  }
  const url = urlSegura(p["urlRastreio"]); if (url) sugestoes.urlRastreio = url;
  const data = texto(p["dataTransmissao"]);
  if (/^\d{4}-\d{2}-\d{2}T/.test(data) && Number.isFinite(Date.parse(data))) sugestoes.dataTransmissao = data;
  const obs = texto(p["observacao"]); if (obs && obs.length <= 1000) sugestoes.observacaoDelivery = obs;
  const provedor = texto(registro(p["provedorEntrega"])["nome"]);
  const status = texto(p["statusTransmissao"]);
  return { ok: true, campos, avisos, sugestoes, pedido: {
    ...(campos.idDelivery ? { idDelivery: campos.idDelivery } : {}),
    ...(provedor && provedor.length <= 255 ? { provedor } : {}),
    ...(status && status.length <= 40 ? { statusTransmissao: status } : {}),
  } };
}

export function erroHttpDelivery(status: number): ResultadoDelivery & { ok: false } {
  if (status === 401 || status === 403) return { ok: false, codigo: "DELIVERY_AUTH", mensagem: "Integração com o Delivery indisponível. Avise o time de TI." };
  if (status >= 400 && status < 500) return { ok: false, codigo: "NOT_FOUND", mensagem: "Pedido não encontrado no Delivery." };
  return { ok: false, codigo: "DELIVERY_UNAVAILABLE", mensagem: "Delivery indisponível no momento. Preencha manualmente ou tente novamente." };
}