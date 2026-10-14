import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enderecoSchema, formatarEndereco } from "@/lib/endereco";
import { notificarNovoChamadoSlack } from "./slack.server";

const texto = (max: number) => z.string().trim().min(1).max(max);
const opcional = (max: number) => z.string().trim().max(max).nullable();

const chamadoSchema = z.object({
  paxNome: texto(255), cpf: texto(20), paxId: texto(255), idDelivery: texto(255),
  destino: texto(255), ano: texto(255), responsavel: texto(255),
  rastreio: texto(255), dataEnvio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  motivos: z.array(texto(100)).min(1).max(10), motivoOutro: opcional(255),
  origemSolicitacao: texto(255), observacao: opcional(1000),
  anexos: z.array(texto(255)).max(20), endereco: enderecoSchema,
}).refine((c) => c.cpf.replace(/\D/g, "").length === 11, { message: "CPF deve ter 11 dígitos." });

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

    const { data: abertos, error: consultaErro } = await context.supabase.from("chamados")
      .select("numero, pax_id").neq("status", "CONCLUÍDO");
    if (consultaErro) throw consultaErro;
    const duplicado = abertos?.find((item) => item.pax_id.trim().toLocaleLowerCase("pt-BR") === c.paxId.toLocaleLowerCase("pt-BR"));
    if (duplicado) throw new Error(`Já existe o chamado #${String(duplicado.numero).padStart(5, "0")} em aberto para o ID do Pax ${c.paxId}. Conclua-o antes de abrir outro.`);

    const { data: perfil } = await context.supabase.from("profiles").select("nome").eq("id", context.userId).maybeSingle();
    const { data, error } = await context.supabase.from("chamados").insert({
      solicitante_id: context.userId,
      solicitante: perfil?.nome || context.claims.email || "Usuário",
      pax_nome: c.paxNome, cpf: c.cpf, pax_id: c.paxId, id_delivery: c.idDelivery,
      destino: c.destino, ano: c.ano, responsavel: c.responsavel,
      rastreio: c.rastreio, endereco: formatarEndereco(c.endereco), data_envio: c.dataEnvio,
      motivos: c.motivos, motivo_outro: c.motivoOutro, origem_solicitacao: c.origemSolicitacao,
      observacao: c.observacao, anexos: c.anexos,
    }).select("numero").single();
    if (error) throw error;
    return { numero: data.numero };
  });