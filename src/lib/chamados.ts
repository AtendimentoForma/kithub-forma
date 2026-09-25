import { useEffect, useState } from "react";

export const STATUSES = [
  "NOVO CHAMADO",
  "EM ANÁLISE",
  "AGUARDANDO CLIENTE",
  "AGUARDANDO PAGAMENTO",
  "REENVIO AUTORIZADO",
  "CONCLUÍDO",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  "NOVO CHAMADO": "Novos chamados",
  "EM ANÁLISE": "Em análise",
  "AGUARDANDO CLIENTE": "Aguardando cliente",
  "AGUARDANDO PAGAMENTO": "Aguardando pagamento",
  "REENVIO AUTORIZADO": "Reenvio autorizado",
  "CONCLUÍDO": "Concluídos",
};

export const MOTIVOS = [
  "Endereço incorreto",
  "Cliente ausente",
  "Pedido extraviado",
  "Recusa de pedido",
  "Outro",
] as const;

export interface Chamado {
  numero: number;
  criadoEm: string;
  solicitante: string;
  status: Status;
  paxNome: string;
  cpf: string;
  paxId: string;
  responsavel: string;
  rastreio: string;
  endereco: string;
  dataEnvio: string;
  motivos: string[];
  motivoOutro?: string;
  observacao?: string;
  anexos: string[];
}

const KEY = "reenvio-kits-chamados";

export function loadChamados(): Chamado[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addChamado(c: Omit<Chamado, "numero" | "criadoEm" | "status">): Chamado {
  const list = loadChamados();
  const numero = list.reduce((m, x) => Math.max(m, x.numero), 0) + 1;
  const novo: Chamado = { ...c, numero, criadoEm: new Date().toISOString(), status: "NOVO CHAMADO" };
  localStorage.setItem(KEY, JSON.stringify([novo, ...list]));
  return novo;
}

export function useChamados() {
  const [list, setList] = useState<Chamado[]>([]);
  useEffect(() => setList(loadChamados()), []);
  return list;
}

export function formatNumero(n: number) {
  return `#${String(n).padStart(5, "0")}`;
}

export const USUARIO_LOJINHA = "Lojinha";
