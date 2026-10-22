import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reversoSchema, anexoReversoSchema, validarArquivoReverso, statusReversoSchema } from "./reversos-schema";

export const listarReversos = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("reversos").select("*").order("numero", { ascending: false });
  if (error) throw error;
  return data ?? [];
});
export const criarReverso = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(data => reversoSchema.parse(data)).handler(async ({ context, data }) => {
  const { data: aprovado, error: aprovacaoErro } = await context.supabase.rpc("meu_status_aprovacao");
  if (aprovacaoErro || !aprovado) throw new Error("Seu acesso não está aprovado.");
  const { data: papeis, error: papelErro } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  const { data: permissoes, error: permissaoErro } = await context.supabase.from("user_permissoes").select("permissao").eq("user_id", context.userId);
  const admin = papeis?.some(p => p.role === "admin");
  if (papelErro || permissaoErro || (!admin && (!papeis?.some(p => p.role === data.perfil) || !permissoes?.some(p => p.permissao === "chamados" || p.permissao === "reenvios")))) throw new Error("Você não tem permissão para abrir reversos neste perfil.");
  for (const anexo of data.anexos) {
    if (!anexo.caminho.startsWith(`${context.userId}/`) || anexo.caminho.includes("..")) throw new Error("Anexo inválido.");
    const { data: blob, error } = await context.supabase.storage.from("reversos-anexos").download(anexo.caminho);
    if (error || !blob) throw new Error("Não foi possível confirmar o envio dos anexos.");
    validarArquivoReverso(blob);
  }
  const { data: perfil } = await context.supabase.from("profiles").select("nome").eq("id", context.userId).maybeSingle();
  const { data: registro, error } = await context.supabase.from("reversos").insert({
    solicitante_id: context.userId, solicitante: perfil?.nome || context.claims.email || "Usuário", perfil_origem: data.perfil,
    origem_solicitacao: data.origens, pax_nome: data.paxNome, cpf: data.cpf, pax_id: data.paxId, id_delivery: data.idDelivery,
    responsavel: data.responsavel, destino: data.destino, ano: data.ano, autorizacao_mandae: data.autorizacaoMandae,
    rastreamento_mandae: data.rastreamentoMandae, kit_outro_destino: data.kitOutroDestino || null, objeto_danificado: data.objetoDanificado || null, motivos: data.motivos, observacao: data.observacao || null, anexos: data.anexos,
  }).select("numero").single();
  if (error) throw error;
  return registro;
});
export const abrirAnexoReverso = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(data => z.object({ numero: z.number().int().positive(), caminho: z.string().max(500) }).parse(data)).handler(async ({ context, data }) => {
  const { data: reverso, error } = await context.supabase.from("reversos").select("anexos").eq("numero", data.numero).single();
  if (error || !reverso || !z.array(anexoReversoSchema).parse(reverso.anexos).some(a => a.caminho === data.caminho)) throw new Error("Anexo não encontrado.");
  const { data: url, error: urlErro } = await context.supabase.storage.from("reversos-anexos").createSignedUrl(data.caminho, 3600);
  if (urlErro || !url) throw new Error("Não foi possível abrir o anexo.");
  return url.signedUrl;
});
export const atualizarStatusReverso = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(data => statusReversoSchema.parse(data)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.rpc("definir_status_reverso", { _numero: data.numero, _status: data.status });
  if (error) throw error;
  return { numero: data.numero, status: data.status };
});
