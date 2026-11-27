import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { enviarChamadoParaZendesk } from "./zendesk-chamado.server";

const mocks = vi.hoisted(() => ({ criar: vi.fn(), enviar: vi.fn(), update: vi.fn(), events: [] as string[] }));
vi.mock("./zendesk.server", () => ({ criarTicketZendesk: mocks.criar, enviarEmailTicketExistente: mocks.enviar }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: () => ({ update: mocks.update }) } }));

function cliente(enviarEmail: boolean, ticketId: number | null = null, role = "sac") {
  const registro = { numero: 19, zendesk_ticket_id: ticketId, zendesk_ticket_url: "ticket/123", zendesk_email_enviado: false,
    responsavel_email: "teste@example.com", destino: "Floripa", motivos: ["Outro"], criado_em: "2026-11-26T12:00:00Z",
    solicitante: "Agente SAC", enviar_email: enviarEmail, email_texto: "Minha mensagem", pax_id: "PAX19", anexos: [] };
  return { auth: { getUser: async () => ({ data: { user: { id: "authenticated-agent", email: "karinna.paixao@formaturismo.com.br" } } }) },
    from: (table: string) => ({ select: () => ({ eq: () => table === "user_roles" ? Promise.resolve({ data: [{ role }], error: null }) : ({ maybeSingle: async () => ({ data: registro, error: null }) }) }) }) } as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.events.length = 0;
  mocks.criar.mockImplementation(async () => { mocks.events.push("criar"); return { id: 123, url: "ticket/123" }; });
  mocks.enviar.mockImplementation(async () => { mocks.events.push("enviar"); });
  mocks.update.mockImplementation((values: Record<string, unknown>) => ({ eq: async () => {
    mocks.events.push(values["zendesk_ticket_id"] ? "salvar-ticket" : values["zendesk_email_enviado"] ? "salvar-email" : "salvar-erro");
    return { error: null };
  } }));
});

describe("persistência entre criação e envio", () => {
  it("Lojinha não envia e-mail no reenvio mesmo com indicação gravada", async () => {
    expect(await enviarChamadoParaZendesk(cliente(true, null, "lojinha"), 19)).toMatchObject({ ok: true, emailEnviado: false });
    expect(mocks.enviar).not.toHaveBeenCalled();
    expect(mocks.criar).toHaveBeenCalledWith(expect.objectContaining({ enviarEmail: false, emailTexto: null }));
  });
  it("aguarda criação e grava ID antes de enviar; marca enviado somente após sucesso", async () => {
    expect(await enviarChamadoParaZendesk(cliente(true), 19)).toMatchObject({ ok: true, ticketId: 123, emailEnviado: true });
    expect(mocks.events).toEqual(["criar", "salvar-ticket", "enviar", "salvar-email"]);
    expect(mocks.enviar).toHaveBeenCalledWith(123, "Minha mensagem", "karinna.paixao@formaturismo.com.br");
  });
  it("opção desmarcada para após salvar o ticket interno", async () => {
    expect(await enviarChamadoParaZendesk(cliente(false), 19)).toMatchObject({ ok: true, emailEnviado: false });
    expect(mocks.events).toEqual(["criar", "salvar-ticket"]);
    expect(mocks.enviar).not.toHaveBeenCalled();
  });
  it("falha de criação impede envio público", async () => {
    mocks.criar.mockRejectedValue(new Error("Falha POST"));
    expect(await enviarChamadoParaZendesk(cliente(true), 19)).toEqual({ ok: false, erro: "Falha POST" });
    expect(mocks.enviar).not.toHaveBeenCalled();
  });
  it("falha no PUT preserva ticket e mantém e-mail não enviado para tentativa posterior", async () => {
    mocks.enviar.mockRejectedValue(new Error("Falha PUT"));
    expect(await enviarChamadoParaZendesk(cliente(true), 19)).toEqual({ ok: true, ticketId: 123, ticketUrl: "ticket/123", emailEnviado: false, emailErro: "Falha PUT" });
    expect(mocks.events).toEqual(["criar", "salvar-ticket", "salvar-erro"]);
    expect(mocks.update.mock.calls.some(([values]) => values.zendesk_email_enviado === true)).toBe(false);
  });
  it("reenviar um ticket vinculado nunca cria outro nem dispara e-mail", async () => {
    expect(await enviarChamadoParaZendesk(cliente(true, 123), 19)).toMatchObject({ ok: true, ticketId: 123, jaEnviado: true, emailEnviado: false });
    expect(mocks.criar).not.toHaveBeenCalled();
    expect(mocks.enviar).not.toHaveBeenCalled();
  });
});