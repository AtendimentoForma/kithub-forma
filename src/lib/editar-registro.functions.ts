import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { editarRegistroSchema, validarEdicao } from "./editar-registro-schema";
import { anexoReversoSchema, validarArquivoReverso } from "./reversos-schema";

export const editarRegistro = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(data => editarRegistroSchema.parse(data)).handler(async ({ context, data }) => {
  const tabela = data.tipo === "chamado" ? "chamados" : "reversos";
  const { data: atual, error } = await context.supabase.from(tabela).select("*").eq("numero", data.numero).single();
  if (error || !atual) throw new Error("Registro não encontrado.");
  const patch = validarEdicao(data.tipo, data.patch, atual);
  const coluna = data.tipo === "chamado" ? "anexos_arquivos" : "anexos";
  if (coluna in patch) {
    const anexos = z.array(anexoReversoSchema).parse(patch[coluna]);
    const anteriores = z.array(anexoReversoSchema).parse(coluna in atual ? atual[coluna as keyof typeof atual] : []);
    for (const a of anexos) {
      if (!anteriores.some(old => old.caminho === a.caminho) && (!a.caminho.startsWith(`${context.userId}/`) || a.caminho.includes(".."))) throw new Error("Anexo inválido.");
      const { data: blob, error: arquivoErro } = await context.supabase.storage.from(data.tipo === "chamado" ? "chamados-anexos" : "reversos-anexos").download(a.caminho);
      if (arquivoErro || !blob) throw new Error("Não foi possível confirmar o anexo.");
      validarArquivoReverso(blob);
    }
  }
  const { error: salvarErro } = await context.supabase.rpc("editar_dados_registro", { _tipo: data.tipo, _numero: data.numero, _patch: patch as never });
  if (salvarErro) throw salvarErro;
  return { numero: data.numero, patch };
});