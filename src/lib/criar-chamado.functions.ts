import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enderecoSchema, formatarEndereco } from "@/lib/endereco";
import { notificarNovoChamadoSlack } from "./slack.server";
import { anexoReversoSchema, validarArquivoReverso } from "./reversos-schema";

const texto = (max: number) => z.string().trim().min(1).max(max);
const opcional = (max: number) => z.string().trim().max(max).nullable();

const chamadoSchema = z.object({
  statusInicial: z.enum([
    "NOVO CHAMADO", "EM ANÁLISE", "AGUARDANDO CLIENTE", "AGUARDANDO PAGAMENTO",
    "REENVIO AUTORIZADO", "ANÁLISE LIDERANÇA", "ANÁLISE LIDERANÇA CONCLUÍDA", "PRIORIDADE DE ENTREGA",
    "PRIORIDADE FINALIZADA", "CONCLUÍDO",
  ]).optional(),
  paxNome: texto(255), cpf: texto(20), paxId: texto(255), idDelivery: texto(255),
  destino: texto(255), ano: texto(255), responsavel: texto(255),
  tipoEnvio: z.enum(["Dados do envio original", "Retirada Torre Forma", "Envio para análise"]).default("Dados do envio original"),
  infoEnvio: opcional(1000).optional(),
  rastreio: z.string().trim().max(255).optional(), dataEnvio: z.string().optional(),
  motivos: z.array(texto(100)).min(1).max(10), motivoOutro: opcional(255), motivoCorreios: opcional(255),
  origemSolicitacao: texto(255), observacao: opcional(1000),
  anexos: z.array(texto(255)).max(20), endereco: enderecoSchema.optional(),
  anexosArquivos: z.array(anexoReversoSchema).max(20).default([]),
}).refine((c) => c.cpf.replace(/\D/g, "").length === 11, { message: "CPF deve ter 11 dígitos." })
  .refine((c) => c.tipoEnvio !== "Dados do envio original" || (!!c.rastreio && /^\d{4}-\d{2}-\d{2}$/.test(c.dataEnvio ?? "") && !!c.endereco), { message: "Preencha os dados do envio original." })
  .refine((c) => c.tipoEnvio === "Dados do envio original" || !!c.infoEnvio?.trim(), { message: "Preencha a observação das informações de envio." })
  .refine((c) => !c.motivos.includes("Envio correios") || !!c.motivoCorreios?.trim(), { message: "Descreva o motivo do envio por correios." });

export const criarChamado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => chamadoSchema.parse(data))
  .handler(async ({ context, data: c }) => {
    const { data: aprovado, error: aprovadoErro } = await context.supabase.rpc("meu_status_aprovacao");
    if (aprovadoErro || !aprovado) throw new Error("Seu acesso não está aprovado.");
    const [{ data: papeis, error: papeisErro }, { data: permissoes, error: permissoesErro }] = await Promise.all([
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("user_permissoes").select("permissao").eq("user_id", context.userId),
    ]);
    if (papeisErro || permissoesErro || !papeis?.some((p) => ["admin", "lojinha", "sac"].includes(p.role)) ||
      (!papeis.some((p) => p.role === "admin") && !permissoes?.some((p) => p.permissao === "chamados" || p.permissao === "reenvios"))) {
      throw new Error("Você não tem permissão para abrir chamados.");
    }

    const original = c.tipoEnvio === "Dados do envio original";
    if (original && (!c.endereco || !c.rastreio || !c.dataEnvio)) throw new Error("Preencha os dados do envio original.");
    for (const anexo of c.anexosArquivos) {
      if (!anexo.caminho.startsWith(`${context.userId}/`) || anexo.caminho.includes("..")) throw new Error("Anexo inválido.");
      const { data: blob, error: anexoErro } = await context.supabase.storage.from("chamados-anexos").download(anexo.caminho);
      if (anexoErro || !blob) throw new Error("Não foi possível confirmar o envio do anexo.");
      validarArquivoReverso(blob);
    }
    const { data: perfil } = await context.supabase.from("profiles").select("nome").eq("id", context.userId).maybeSingle();
    const { data, error } = await context.supabase.from("chamados").insert({
      solicitante_id: context.userId,
      solicitante: perfil?.nome || context.claims.email || "Usuário",
      pax_nome: c.paxNome, cpf: c.cpf, pax_id: c.paxId, id_delivery: c.idDelivery,
      destino: c.destino, ano: c.ano, responsavel: c.responsavel,
      rastreio: original ? c.rastreio ?? "—" : "—",
      endereco: original && c.endereco ? formatarEndereco(c.endereco) : `${c.tipoEnvio}: ${c.infoEnvio}`,
      data_envio: original ? c.dataEnvio ?? "" : new Date().toISOString().slice(0, 10),
      motivos: c.motivos, motivo_outro: c.motivoOutro, motivo_correios: c.motivoCorreios, origem_solicitacao: c.origemSolicitacao,
      observacao: c.observacao, anexos: c.anexos, anexos_arquivos: c.anexosArquivos,
    }).select("numero").single();
    if (error) throw error;
    await notificarNovoChamadoSlack({
      numero: data.numero,
      solicitante: perfil?.nome || context.claims.email || "Usuário",
      paxNome: c.paxNome, paxId: c.paxId, idDelivery: c.idDelivery,
      destino: c.destino, ano: c.ano,
      motivos: c.motivos, motivoOutro: c.motivoOutro, motivoCorreios: c.motivoCorreios,
      origem: c.origemSolicitacao,
      status: c.statusInicial ?? "NOVO CHAMADO",
    });
    return { numero: data.numero };
  });
const normalizar = (v: string | null | undefined) => (v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
const soDigitos = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

export const buscarChamadosSemelhantes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paxNome: z.string().max(255), cpf: z.string().max(20), paxId: z.string().max(255), idDelivery: z.string().max(255) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: chamados, error } = await context.supabase.from("chamados")
      .select("numero, pax_nome, cpf, pax_id, id_delivery, status, criado_em").order("numero", { ascending: false }).limit(5000);
    if (error) throw new Error("Não foi possível verificar chamados existentes.");
    const nome = normalizar(data.paxNome), cpf = soDigitos(data.cpf), pax = normalizar(data.paxId), delivery = normalizar(data.idDelivery);
    return (chamados ?? []).map((c) => {
      const iguais: string[] = [];
      if (delivery && normalizar(c.id_delivery) === delivery) iguais.push("ID Delivery");
      if (pax && normalizar(c.pax_id) === pax) iguais.push("ID do Pax");
      if (cpf.length === 11 && soDigitos(c.cpf) === cpf) iguais.push("CPF");
      if (nome && normalizar(c.pax_nome) === nome) iguais.push("Nome");
      return { numero: c.numero, paxNome: c.pax_nome, paxId: c.pax_id, idDelivery: c.id_delivery, status: c.status, criadoEm: c.criado_em, iguais };
    }).filter((c) => c.iguais.length > 0).slice(0, 10);
  });
