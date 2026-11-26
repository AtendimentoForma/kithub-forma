import { describe, expect, it } from "vitest";
import { opcaoEmailZendesk, podeEnviarEmailZendesk, perfilPrincipal } from "./zendesk-permissoes";

describe("permissão de e-mail por perfil", () => {
  it("perfil Lojinha adicional não esconde o acesso SAC", () => {
    expect(perfilPrincipal(["lojinha", "sac"])).toBe("sac");
    expect(perfilPrincipal(["admin", "lojinha", "sac"])).toBe("admin");
  });
  it.each(["Agente SAC atual", "Agente SAC futuro"])("%s tem a mesma permissão sem depender de identidade ou permissões adicionais", () => {
    expect(podeEnviarEmailZendesk(["sac"])).toBe(true);
    expect(opcaoEmailZendesk(["sac"], true, "Meu texto\nSegunda linha")).toEqual({ enviarEmail: true, emailTexto: "Meu texto\nSegunda linha" });
  });
  it("Lojinha ignora opção e texto, mesmo recebidos no pedido", () => {
    expect(opcaoEmailZendesk(["lojinha"], true, "Texto indevido")).toEqual({ enviarEmail: false, emailTexto: null });
    expect(podeEnviarEmailZendesk(["lojinha"])).toBe(false);
  });
  it.each([null, undefined, [], ["desconhecido"]])("perfil não identificado falha de forma segura (%s)", (roles) => {
    expect(opcaoEmailZendesk(roles, true, "Texto")).toEqual({ enviarEmail: false, emailTexto: null });
  });
  it("SAC com envio desmarcado não registra texto para e-mail", () => {
    expect(opcaoEmailZendesk(["sac"], false, "Texto")).toEqual({ enviarEmail: false, emailTexto: null });
  });
  it("comentário obrigatório para SAC que solicita envio", () => {
    expect(() => opcaoEmailZendesk(["sac"], true, "   ")).toThrow("Escreva a mensagem");
  });
  it("preserva a autorização administrativa existente", () => {
    expect(podeEnviarEmailZendesk(["admin"])).toBe(true);
  });
});