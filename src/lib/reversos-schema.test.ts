import { describe, it, expect } from "vitest";
import { reversoSchema, statusReversoSchema, validarArquivoReverso } from "./reversos-schema";
const dados = { perfil: "sac", origens: ["Cliente entrou em contato"], paxNome: "Passageiro", cpf: "12345678901", paxId: "PAX1", idDelivery: "DEL1", responsavel: "Responsável", destino: "Floripa", ano: "2026", dadosReverso: true, autorizacaoMandae: "AUT1", rastreamentoMandae: "RAS1", kitOutroDestino: "", motivos: ["Troca de tamanho"], observacao: "", anexos: [] };
describe("Regras de reversos", () => {
  it("Objeto danificado exige informar o que aconteceu", () => {
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Objeto danificado"], objetoDanificado: "   " }).success).toBe(false);
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Objeto danificado"], objetoDanificado: "A caixa chegou amassada e o objeto quebrou." }).success).toBe(true);
  });
  it("Permite os quatro motivos juntos com suas informações obrigatórias", () => {
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Troca de tamanho", "Defeito", "Kit de outro destino", "Objeto danificado"], kitOutroDestino: "Kit Floripa", objetoDanificado: "Rasgado", anexos: [{ nome: "foto.png", caminho: "user/foto", tipo: "image/png", tamanho: 100 }] }).success).toBe(true);
  });
  it("Permite Reverso concluído e rejeita status de chamados comuns", () => {
    expect(statusReversoSchema.safeParse({ numero: 1, status: "REVERSO CONCLUÍDO" }).success).toBe(true);
    expect(statusReversoSchema.safeParse({ numero: 1, status: "CONCLUÍDO" }).success).toBe(false);
  });
  it("Aceita fotos e vídeos e mantém o limite de 10 MB", () => {
    for (const type of ["image/jpeg", "video/mp4", "video/webm", "video/quicktime"]) expect(() => validarArquivoReverso({ size: 100, type })).not.toThrow();
    expect(() => validarArquivoReverso({ size: 10 * 1024 * 1024 + 1, type: "video/mp4" })).toThrow();
    expect(() => validarArquivoReverso({ size: 100, type: "text/html" })).toThrow();
  });
  it("Defeito exige foto ou documento", () => {
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Defeito"] }).success).toBe(false);
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Troca de tamanho", "Defeito"], anexos: [{ nome: "foto.png", caminho: "user/foto.png", tipo: "image/png", tamanho: 100 }] }).success).toBe(true);
  });
  it("Troca de tamanho não exige anexo", () => expect(reversoSchema.safeParse(dados).success).toBe(true));
  it("Não permite motivos fora da lista", () => expect(reversoSchema.safeParse({ ...dados, motivos: ["Outro"] }).success).toBe(false));
  it("Kit de outro destino exige a descrição do kit e destino", () => {
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Kit de outro destino"], kitOutroDestino: "" }).success).toBe(false);
    expect(reversoSchema.safeParse({ ...dados, motivos: ["Kit de outro destino"], kitOutroDestino: "Kit Rio de Janeiro recebido" }).success).toBe(true);
    expect(reversoSchema.safeParse({ ...dados, kitOutroDestino: "" }).success).toBe(true);
  });
  it("Dados do reverso requer autorização e rastreamento Mandaê", () => {
    expect(reversoSchema.safeParse({ ...dados, autorizacaoMandae: "" }).success).toBe(false);
    expect(reversoSchema.safeParse({ ...dados, rastreamentoMandae: "" }).success).toBe(false);
    expect(reversoSchema.safeParse({ ...dados, dadosReverso: false }).success).toBe(false);
  });
});
