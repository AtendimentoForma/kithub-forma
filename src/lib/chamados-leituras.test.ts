import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/admin-users.functions", () => ({ confirmarEmailDoUsuario: vi.fn() }));

import { chamadoNaoVisto, MARCA_NAO_LIDO, type Chamado } from "./chamados";

const chamado = { numero: 26, criadoEm: "2026-10-21T14:00:00Z", solicitanteId: "autor", status: "NOVO CHAMADO" } as Chamado;

describe("Leitura individual de chamados", () => {
  it("indica novidade até o agente abrir o chamado, mesmo sem movimentações", () => {
    expect(chamadoNaoVisto(chamado, undefined, { usuarioId: "agente", vistos: {} })).toBe(true);
    expect(chamadoNaoVisto(chamado, undefined, { usuarioId: "agente", vistos: { 26: chamado.criadoEm } })).toBe(false);
  });
  it("a leitura de um agente não retira a novidade de outro", () => {
    expect(chamadoNaoVisto(chamado, undefined, { usuarioId: "agente-a", vistos: { 26: chamado.criadoEm } })).toBe(false);
    expect(chamadoNaoVisto(chamado, undefined, { usuarioId: "agente-b", vistos: {} })).toBe(true);
  });
  it("uma movimentação posterior à leitura volta a indicar novidade", () => {
    expect(chamadoNaoVisto(chamado, { autorId: "autor", criadoEm: "2026-10-21T14:16:00Z" }, { usuarioId: "agente", vistos: { 26: chamado.criadoEm } })).toBe(true);
  });
  it("preserva a marcação manual de não lido, inclusive em concluídos", () => {
    expect(chamadoNaoVisto({ ...chamado, status: "CONCLUÍDO" }, undefined, { usuarioId: "agente", vistos: { 26: MARCA_NAO_LIDO } })).toBe(true);
    expect(chamadoNaoVisto({ ...chamado, status: "CONCLUÍDO" }, undefined, { usuarioId: "agente", vistos: {} })).toBe(false);
  });
});