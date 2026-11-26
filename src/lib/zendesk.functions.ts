import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enviarChamadoParaZendesk } from "./zendesk-chamado.server";

export const reenviarChamadoZendesk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ numero: z.number().int().positive() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: aprovado } = await context.supabase.rpc("meu_status_aprovacao");
    if (!aprovado) throw new Error("Seu acesso não está aprovado.");
    return enviarChamadoParaZendesk(context.supabase, data.numero);
  });

export const enviarEmailChamadoZendesk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ numero: z.number().int().positive(), texto: z.string().trim().min(1, "Escreva o texto do e-mail.").max(5000) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: aprovado } = await context.supabase.rpc("meu_status_aprovacao");
    if (!aprovado) throw new Error("Seu acesso não está aprovado.");
    const { data: papeis } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!papeis?.some((p) => p.role === "sac" || p.role === "admin")) throw new Error("Somente o SAC pode enviar e-mail pelo chamado.");
    const { data: c } = await context.supabase.from("chamados").select("numero, zendesk_ticket_id, zendesk_email_enviado").eq("numero", data.numero).maybeSingle();
    if (!c) throw new Error("Chamado não encontrado.");
    if (c.zendesk_email_enviado) throw new Error("O e-mail deste chamado já foi enviado.");
    if (!c.zendesk_ticket_id) throw new Error("O chamado ainda não tem ticket na Zendesk. Reenvie para a Zendesk primeiro.");
    const { enviarEmailTicketExistente, prepararTextoEmail } = await import("./zendesk.server");
    const texto = await prepararTextoEmail(data.texto);
    if (!texto) throw new Error("Escreva o texto do e-mail.");
    await enviarEmailTicketExistente(c.zendesk_ticket_id, texto);
    const { data: perfil } = await context.supabase.from("profiles").select("nome").eq("id", context.userId).maybeSingle();
    const por = perfil?.nome || context.claims.email || "SAC";
    const em = new Date().toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("chamados").update({ zendesk_email_enviado: true, enviar_email: true, email_texto: texto, zendesk_email_enviado_em: em, zendesk_email_enviado_por: por }).eq("numero", data.numero);
    return { em, por, texto };
  });
