import { z } from "zod";

export const ORIGENS_REVERSO = ["Cliente entrou em contato", "Identificado internamente"] as const;
export const MOTIVOS_REVERSO = ["Troca de tamanho", "Defeito", "Kit de outro destino", "Objeto danificado"] as const;
export const STATUS_REVERSO = ["NOVO REVERSO", "REVERSO CONCLUÍDO"] as const;
export const statusReversoSchema = z.object({ numero: z.number().int().positive(), status: z.enum(STATUS_REVERSO) });
const texto = z.string().trim().min(1, "Preencha os campos obrigatórios.").max(255);
export const anexoReversoSchema = z.object({ nome: texto, caminho: z.string().min(1).max(500), tipo: z.string().max(100), tamanho: z.number().positive().max(10 * 1024 * 1024) });
export const reversoSchema = z.object({
  perfil: z.enum(["lojinha", "sac"]),
  origens: z.array(z.enum(ORIGENS_REVERSO)).min(1, "Selecione a origem da solicitação.").max(2),
  paxNome: texto, cpf: texto.refine(v => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos."),
  paxId: texto, idDelivery: texto, responsavel: texto, destino: texto, ano: texto,
  dadosReverso: z.literal(true, { errorMap: () => ({ message: "Selecione Dados do reverso." }) }),
  autorizacaoMandae: texto, rastreamentoMandae: texto,
  kitOutroDestino: z.string().trim().max(255),
  objetoDanificado: z.string().trim().max(1000).default(""),
  motivos: z.array(z.enum(MOTIVOS_REVERSO)).min(1, "Selecione ao menos um motivo.").max(4),
  observacao: z.string().trim().max(1000), anexos: z.array(anexoReversoSchema).max(20),
}).refine(v => !v.motivos.includes("Defeito") || v.anexos.length > 0, { message: "Para Defeito, anexe ao menos uma foto ou documento.", path: ["anexos"] })
  .refine(v => !v.motivos.includes("Kit de outro destino") || v.kitOutroDestino.length > 0, { message: "Descreva qual kit de qual destino foi recebido.", path: ["kitOutroDestino"] })
  .refine(v => !v.motivos.includes("Objeto danificado") || v.objetoDanificado.length > 0, { message: "Descreva o que aconteceu com o objeto danificado.", path: ["objetoDanificado"] });
export type AnexoReverso = z.infer<typeof anexoReversoSchema>;
export function validarArquivoReverso(file: { size: number; type: string }) {
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("Cada arquivo deve ter até 10 MB e não pode estar vazio.");
  if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "video/mp4", "video/webm", "video/quicktime", "video/ogg", "application/pdf"].includes(file.type)) throw new Error("Anexe fotos, vídeos MP4, WebM, MOV ou documentos PDF.");
}
