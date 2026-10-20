import { z } from "zod";

export const ORIGENS_REVERSO = ["Cliente entrou em contato", "Identificado internamente"] as const;
export const MOTIVOS_REVERSO = ["Troca de tamanho", "Defeito"] as const;
const texto = z.string().trim().min(1, "Preencha os campos obrigatórios.").max(255);
export const anexoReversoSchema = z.object({ nome: texto, caminho: z.string().min(1).max(500), tipo: z.string().max(100), tamanho: z.number().positive().max(10 * 1024 * 1024) });
export const reversoSchema = z.object({
  perfil: z.enum(["lojinha", "sac"]),
  origens: z.array(z.enum(ORIGENS_REVERSO)).min(1, "Selecione a origem da solicitação.").max(2),
  paxNome: texto, cpf: texto.refine(v => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos."),
  paxId: texto, idDelivery: texto, responsavel: texto, destino: texto, ano: texto,
  dadosReverso: z.literal(true, { errorMap: () => ({ message: "Selecione Dados do reverso." }) }),
  autorizacaoMandae: texto, rastreamentoMandae: texto,
  motivos: z.array(z.enum(MOTIVOS_REVERSO)).min(1, "Selecione ao menos um motivo.").max(2),
  observacao: z.string().trim().max(1000), anexos: z.array(anexoReversoSchema).max(20),
}).refine(v => !v.motivos.includes("Defeito") || v.anexos.length > 0, { message: "Para Defeito, anexe ao menos uma foto ou documento.", path: ["anexos"] });
export type AnexoReverso = z.infer<typeof anexoReversoSchema>;
export function validarArquivoReverso(file: { size: number; type: string }) {
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("Cada arquivo deve ter até 10 MB e não pode estar vazio.");
  if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "application/pdf"].includes(file.type)) throw new Error("Anexe fotos ou documentos PDF.");
}
