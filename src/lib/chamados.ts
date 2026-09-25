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
  origemSolicitacao: string;
  observacao?: string | null;
  anexos: string[];
  confDados: boolean;
  confEnvio: boolean;
  confMotivo: boolean;
  requerReenvio: boolean | null;
  motivoCancelamento: string | null;
  requerPagamento: boolean | null;
  valorFrete: number | null;
  statusPagamento: StatusPagamento | null;
  novoRastreio: string | null;
  despachadoEm: string | null;
}

export type StatusPagamento = "PENDENTE" | "RECEBIDO" | "CANCELADO";

export type NovoChamado = Pick<Chamado, "paxNome" | "cpf" | "paxId" | "responsavel" | "rastreio" | "endereco" | "dataEnvio" | "motivos" | "motivoOutro" | "origemSolicitacao" | "observacao" | "anexos">;

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
    origemSolicitacao: r.origem_solicitacao ?? "",
    observacao: r.observacao,
    anexos: r.anexos ?? [],
    confDados: !!r.conf_dados,
    confEnvio: !!r.conf_envio,
    confMotivo: !!r.conf_motivo,
    requerReenvio: r.requer_reenvio ?? null,
    motivoCancelamento: r.motivo_cancelamento ?? null,
    requerPagamento: r.requer_pagamento ?? null,
    valorFrete: r.valor_frete != null ? Number(r.valor_frete) : null,
    statusPagamento: r.status_pagamento ?? null,
    novoRastreio: r.novo_rastreio ?? null,
    despachadoEm: r.despachado_em ?? null,
  };
}

/** SAC/Admin: atualiza campos do chamado e registra a movimentação correspondente. */
export async function atualizarFluxo(
  numero: number,
  patch: Record<string, unknown>,
  texto: string | null,
  statusNovo: Status | null,
) {
  if (Object.keys(patch).length) {
    const { error } = await supabase.from("chamados").update(patch as never).eq("numero", numero);
    if (error) throw error;
  }
  if (texto || statusNovo) await addMovimentacao(numero, texto, statusNovo);
}

export async function despacharChamado(numero: number, rastreio: string) {
  const { error } = await supabase.rpc("despachar_chamado", { _numero: numero, _rastreio: rastreio });
  if (error) throw error;
}

export const chamadosQuery = queryOptions({
  queryKey: ["chamados"],
  queryFn: async () => {
    const { data, error } = await supabase.from("chamados").select("*").order("numero", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  },
});

/** Última movimentação de cada chamado para tempo de espera e notificações. */
export const ultimasMovimentacoesQuery = queryOptions({
  queryKey: ["ultimas-movimentacoes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("chamado_movimentacoes")
      .select("chamado_numero, criado_em, autor_id")
      .order("criado_em", { ascending: false });
    if (error) throw error;
    const mapa: Record<number, { criadoEm: string; autorId: string }> = {};
    for (const m of data ?? []) {
      if (mapa[m.chamado_numero] == null) mapa[m.chamado_numero] = { criadoEm: m.criado_em, autorId: m.autor_id };
    }
    return mapa;
  },
  refetchInterval: 15000,
});

export const leiturasQuery = queryOptions({
  queryKey: ["chamado-leituras"],
  queryFn: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Sessão expirada. Entre novamente.");
    const { data, error } = await supabase.from("chamado_leituras").select("chamado_numero, visto_em").eq("usuario_id", user.id);
    if (error) throw error;
    return { usuarioId: user.id, vistos: Object.fromEntries((data ?? []).map((item) => [item.chamado_numero, item.visto_em])) as Record<number, string> };
  },
  refetchInterval: 15000,
});

export async function marcarChamadoVisto(numero: number, vistoEm: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Sessão expirada. Entre novamente.");
  const { error } = await supabase.from("chamado_leituras").upsert({
    usuario_id: user.id,
    chamado_numero: numero,
    visto_em: vistoEm,
  }, { onConflict: "usuario_id,chamado_numero" });
  if (error) throw error;
}

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
      origem_solicitacao: c.origemSolicitacao,
      observacao: c.observacao ?? null,
      anexos: c.anexos,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateStatus(numero: number, status: Status) {
  await addMovimentacao(numero, null, status);
}

export const movimentacoesQuery = (numero: number) =>
  queryOptions({
    queryKey: ["movimentacoes", numero],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamado_movimentacoes")
        .select("*")
        .eq("chamado_numero", numero)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export async function addMovimentacao(numero: number, texto: string | null, statusNovo: Status | null) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sessão expirada. Entre novamente.");
  const { error } = await supabase.from("chamado_movimentacoes").insert({
    chamado_numero: numero,
    autor_id: u.user.id,
    texto,
    status_novo: statusNovo,
  });
  if (error) throw error;
}

export type Perfil = "lojinha" | "sac" | "admin";

export async function getMyRole(): Promise<Perfil | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: aprovado } = await supabase.rpc("meu_status_aprovacao");
  if (!aprovado) return null;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("lojinha")) return "lojinha";
  if (roles.includes("sac")) return "sac";
  return null;
}

export async function estouAprovado(): Promise<boolean> {
  const { data } = await supabase.rpc("meu_status_aprovacao");
  return !!data;
}

export type UsuarioAdmin = { id: string; nome: string; email: string | null; created_at: string; aprovado: boolean; papeis: string[] };

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase.rpc("admin_listar_usuarios");
  if (error) throw error;
  return (data ?? []) as UsuarioAdmin[];
}

export async function definirUsuario(id: string, aprovado: boolean, papel: Perfil) {
  const { error } = await supabase.rpc("admin_definir_usuario", { _id: id, _aprovado: aprovado, _papel: papel });
  if (error) throw error;
}

export function formatNumero(n: number) {
  return `#${String(n).padStart(5, "0")}`;
}
