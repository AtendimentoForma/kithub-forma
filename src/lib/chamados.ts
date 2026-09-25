import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  motivoOutro?: string | null;
  observacao?: string | null;
  anexos: string[];
}

export type NovoChamado = Omit<Chamado, "numero" | "criadoEm" | "status" | "solicitante">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Chamado {
  return {
    numero: r.numero,
    criadoEm: r.criado_em,
    solicitante: r.solicitante,
    status: r.status,
    paxNome: r.pax_nome,
    cpf: r.cpf,
    paxId: r.pax_id,
    responsavel: r.responsavel,
    rastreio: r.rastreio,
    endereco: r.endereco,
    dataEnvio: r.data_envio,
    motivos: r.motivos ?? [],
    motivoOutro: r.motivo_outro,
    observacao: r.observacao,
    anexos: r.anexos ?? [],
  };
}

export const chamadosQuery = queryOptions({
  queryKey: ["chamados"],
  queryFn: async () => {
    const { data, error } = await supabase.from("chamados").select("*").order("numero", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  },
});

export async function addChamado(c: NovoChamado): Promise<Chamado> {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  const { data: perfil } = await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
  const { data, error } = await supabase
    .from("chamados")
    .insert({
      solicitante_id: user.id,
      solicitante: perfil?.nome || user.email || "Lojinha",
      pax_nome: c.paxNome,
      cpf: c.cpf,
      pax_id: c.paxId,
      responsavel: c.responsavel,
      rastreio: c.rastreio,
      endereco: c.endereco,
      data_envio: c.dataEnvio,
      motivos: c.motivos,
      motivo_outro: c.motivoOutro ?? null,
      observacao: c.observacao ?? null,
      anexos: c.anexos,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateStatus(numero: number, status: Status) {
  const { error } = await supabase.from("chamados").update({ status }).eq("numero", numero);
  if (error) throw error;
}

export type Perfil = "lojinha" | "sac";

export async function getMyRole(): Promise<Perfil | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("lojinha")) return "lojinha";
  if (roles.includes("sac")) return "sac";
  return null;
}

export function formatNumero(n: number) {
  return `#${String(n).padStart(5, "0")}`;
}
