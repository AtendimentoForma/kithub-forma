import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anexoReversoSchema } from "./reversos-schema";

export const abrirAnexoChamado = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(data => z.object({ numero: z.number().int().positive(), caminho: z.string().max(500) }).parse(data)).handler(async ({ context, data }) => {
  const { data: chamado, error } = await context.supabase.from("chamados").select("anexos_arquivos").eq("numero", data.numero).single();
  const anexos = z.array(anexoReversoSchema).safeParse(chamado?.anexos_arquivos);
  if (error || !anexos.success || !anexos.data.some(a => a.caminho === data.caminho)) throw new Error("Anexo não encontrado.");
  const { data: url, error: urlErro } = await context.supabase.storage.from("chamados-anexos").createSignedUrl(data.caminho, 3600);
  if (urlErro || !url) throw new Error("Não foi possível abrir o anexo.");
  return url.signedUrl;
});