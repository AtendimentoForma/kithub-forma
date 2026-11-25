import { describe, it, expect } from "vitest";
import { tagsDoTicket, TAG_CHAMADO, TAG_ENVIADO } from "./zendesk-config";

describe("tags do ticket na Zendesk", () => {
  it("caixa desmarcada: só chamado_kithub", () => {
    expect(tagsDoTicket(false)).toEqual(["chamado_kithub"]);
  });
  it("caixa marcada: chamado_kithub + chamado_kithub_enviado", () => {
    expect(tagsDoTicket(true)).toEqual(["chamado_kithub", "chamado_kithub_enviado"]);
  });
  it("nomes exatos, em minúsculas e com underline", () => {
    expect(TAG_CHAMADO).toBe("chamado_kithub");
    expect(TAG_ENVIADO).toBe("chamado_kithub_enviado");
  });
});
