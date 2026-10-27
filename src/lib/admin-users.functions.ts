import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const confirmarEmailDoUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: papel, error: papelError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (papelError || !papel) throw new Error("Somente administradores podem aprovar usuários.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email_confirm: true });
    if (error) throw new Error("Não foi possível liberar o acesso deste usuário.");

    return { ok: true };
  });

export const alterarSenhaDoUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres.").max(72) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: papel, error: papelError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (papelError || !papel) throw new Error("Somente administradores podem alterar senhas.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.senha });
    if (error) {
      console.error("alterarSenhaDoUsuario", error);
      throw new Error("Não foi possível alterar a senha. Tente uma senha diferente.");
    }
    return { ok: true };
  });