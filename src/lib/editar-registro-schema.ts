import { z } from "zod";
import { DESTINOS, MOTIVOS } from "./chamados";
import { MOTIVOS_REVERSO, ORIGENS_REVERSO, anexoReversoSchema } from "./reversos-schema";
import { enderecoSchema, formatarEndereco } from "./endereco";

const texto = z.string().trim().min(1, "Preencha o campo obrigatório.").max(255);
const opcional = z.string().trim().max(1000);
export const CAMPOS_COMUNS = ["pax_nome", "cpf", "pax_id", "id_delivery", "responsavel", "destino", "ano", "observacao"] as const;
export const CAMPOS_CHAMADO = [...CAMPOS_COMUNS, "rastreio", "data_envio", "endereco", "origem_solicitacao", "motivos", "motivo_outro", "motivo_correios", "anexos", "anexos_arquivos"] as const;
export const CAMPOS_REVERSO = [...CAMPOS_COMUNS, "autorizacao_mandae", "rastreamento_mandae", "origem_solicitacao", "motivos", "kit_outro_destino", "objeto_danificado", "anexos"] as const;
export const editarRegistroSchema = z.object({ tipo: z.enum(["chamado", "reverso"]), numero: z.number().int().positive(), patch: z.record(z.unknown()).refine(p => Object.keys(p).length > 0, "Nenhuma alteração informada.") });

/** Validate only changed fields so legacy incomplete records remain correctable. */
export function validarEdicao(tipo: "chamado" | "reverso", patch: Record<string, unknown>, atual: Record<string, unknown>) {
  const permitidos: readonly string[] = tipo === "chamado" ? CAMPOS_CHAMADO : CAMPOS_REVERSO;
  const validado: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(patch)) {
    if (!permitidos.includes(campo)) throw new Error("Este campo não pode ser alterado.");
    if (campo === "cpf") validado[campo] = texto.refine(v => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos.").parse(valor);
    else if (campo === "destino") validado[campo] = z.enum(DESTINOS).parse(valor);
    else if (campo === "motivos") validado[campo] = tipo === "reverso" ? z.array(z.enum(MOTIVOS_REVERSO)).min(1).max(4).parse(valor) : z.array(z.enum(MOTIVOS)).min(1).max(10).parse(valor);
    else if (campo === "origem_solicitacao") {
      const origens = z.array(z.enum(ORIGENS_REVERSO)).min(1).max(2).parse(valor);
      validado[campo] = tipo === "reverso" ? origens : origens.join(", ");
    } else if (campo === "endereco") {
      const envio = z.object({ tipo: z.enum(["Dados do envio original", "Retirada Torre Forma", "Envio para análise"]), endereco: enderecoSchema.optional(), observacao: opcional.optional() }).parse(valor);
      if (envio.tipo === "Dados do envio original") validado[campo] = formatarEndereco(enderecoSchema.parse(envio.endereco));
      else {
        if (!envio.observacao?.trim()) throw new Error("Preencha a observação das informações de envio.");
        validado[campo] = `${envio.tipo}: ${envio.observacao}`;
      }
    } else if (campo === "data_envio") {
      const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").parse(valor);
      const date = new Date(`${data}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data) throw new Error("Informe uma data válida.");
      validado[campo] = data;
    } else if (campo === "anexos_arquivos" || (campo === "anexos" && tipo === "reverso")) validado[campo] = z.array(anexoReversoSchema).max(20).parse(valor);
    else if (campo === "anexos") validado[campo] = z.array(texto).max(20).parse(valor);
    else if (["observacao", "motivo_outro", "motivo_correios", "kit_outro_destino", "objeto_danificado"].includes(campo)) validado[campo] = opcional.parse(valor);
    else validado[campo] = texto.parse(valor);
  }
  const merged = { ...atual, ...validado };
  const motivos = z.array(z.string()).parse(merged["motivos"] ?? []);
  if ("motivos" in patch || "motivo_outro" in patch || "motivo_correios" in patch || "kit_outro_destino" in patch || "objeto_danificado" in patch || "anexos" in patch) {
    const exige = (motivo: string, campo: string, erro: string) => { if (motivos.includes(motivo) && !String(merged[campo] ?? "").trim()) throw new Error(erro); };
    if (tipo === "reverso") {
      exige("Kit de outro destino", "kit_outro_destino", "Descreva qual kit de qual destino foi recebido.");
      exige("Objeto danificado", "objeto_danificado", "Descreva o que aconteceu com o objeto danificado.");
      if (motivos.includes("Defeito") && (!Array.isArray(merged["anexos"]) || merged["anexos"].length === 0)) throw new Error("Para Defeito, anexe ao menos uma foto, vídeo ou documento.");
    } else {
      exige("Outro", "motivo_outro", "Descreva o motivo Outro.");
      exige("Envio correios", "motivo_correios", "Descreva o motivo do envio por correios.");
    }
  }
  return validado;
}