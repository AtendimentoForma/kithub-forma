import { describe, it, expect } from "vitest";
import { contar, resumo, filtrar, intervalo } from "./relatorio-reversos";
const r = (numero: number, criado_em: string, status: string, motivos: string[], data_finalizacao: string | null = null) => ({ numero, criado_em, status, destino: "Porto", motivos, pax_nome: "X", data_finalizacao });
const agora = new Date("2026-11-10T12:00:00");
const lista = [r(1, "2026-11-01T10:00:00", "NOVO REVERSO", ["Defeito", "Troca de tamanho"]), r(2, "2026-11-05T10:00:00", "FINALIZADO", ["Defeito"], "2026-11-07T10:00:00"), r(3, "2026-11-06T10:00:00", "FINALIZADO", ["Defeito"])];
describe("relatório de reversos", () => {
  it("pedido com dois motivos conta uma vez em cada; % pode passar de 100", () => {
    const m = contar(lista, x => x.motivos);
    expect(m[0]).toMatchObject({ nome: "Defeito", total: 3, pct: 100 });
    expect(m.reduce((s, x) => s + x.pct, 0)).toBeGreaterThan(100);
  });
  it("tempo médio só usa finalizados com data; mais antigo em aberto", () => {
    const s = resumo(lista, agora);
    expect(s.total).toBe(3); expect(s.finalizados).toBe(2); expect(s.mediaDias).toBe(2);
    expect(s.maisAntigo).toEqual({ numero: 1, dias: 9 });
  });
  it("filtra pela data de criação no período", () => {
    const i = intervalo("7", "", "", agora);
    expect(filtrar(lista, { ...i, local: "", motivo: "", status: "" }).map(x => x.numero)).toEqual([2, 3]);
  });
});
