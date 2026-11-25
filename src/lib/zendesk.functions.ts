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
