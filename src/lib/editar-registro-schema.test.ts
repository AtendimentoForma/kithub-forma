import { describe, expect, it } from "vitest";
import { validarEdicao } from "./editar-registro-schema";
const reverso = { motivos: ["Troca de tamanho"], anexos: [] };
describe("Correção das informações", () => {
  it("permite corrigir passageiro de registros antigos sem exigir outros campos ausentes", () => expect(validarEdicao("chamado", { pax_nome: " Nome correto " }, {}).pax_nome).toBe("Nome correto"));
  it("mantém CPF de 11 dígitos", () => { expect(() => validarEdicao("chamado", { cpf: "123" }, {})).toThrow(); expect(validarEdicao("reverso", { cpf: "123.456.789-01" }, reverso).cpf).toBe("123.456.789-01"); });
  it("não permite alterar número, autor ou status por correção", () => { for (const campo of ["numero", "solicitante_id", "status", "aprovado"]) expect(() => validarEdicao("chamado", { [campo]: "x" }, {})).toThrow(); });
  it("preserva descrição obrigatória de Objeto danificado", () => { expect(() => validarEdicao("reverso", { motivos: ["Objeto danificado"] }, reverso)).toThrow(); expect(validarEdicao("reverso", { motivos: ["Objeto danificado"], objeto_danificado: "Chegou quebrado" }, reverso).objeto_danificado).toBe("Chegou quebrado"); });
  it("preserva anexos obrigatórios de Defeito", () => expect(() => validarEdicao("reverso", { motivos: ["Defeito"] }, reverso)).toThrow());
  it("preserva a descrição de Kit de outro destino", () => expect(() => validarEdicao("reverso", { kit_outro_destino: "" }, { ...reverso, motivos: ["Kit de outro destino"] })).toThrow());
  it("preserva motivo obrigatório para envio correios", () => expect(() => validarEdicao("chamado", { motivos: ["Envio correios"] }, {})).toThrow());
  it("não permite gravar endereço original incompleto", () => expect(() => validarEdicao("chamado", { endereco: { tipo: "Dados do envio original", endereco: {} } }, {})).toThrow());
});