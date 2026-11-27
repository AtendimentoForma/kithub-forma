import { afterEach, describe, expect, it, vi } from "vitest";
import { agenteZendeskPorEmail, enviarEmailTicketExistente } from "./zendesk.server";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function api(users: unknown[]) {
  vi.stubEnv("LOVABLE_API_KEY", "test-project");
  vi.stubEnv("ZENDESK_API_KEY", "test-connection");
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => new Response(JSON.stringify(url.includes("/users/search")
    ? { users, next_page: null }
    : { ticket: { tags: ["chamado_kithub", "existente"], updated_at: "2026-11-27T14:40:00Z" } })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("autoria pelo agente SAC que realiza a ação", () => {
  it.each([
    ["karinna.paixao@formaturismo.com.br", 15508217755795],
    ["julia.sales@formaturismo.com.br", 426086753614],
    ["novo.sac@example.com", 999],
  ])("usa o agente de %s sem um autor fixo", async (email, id) => {
    const fetchMock = api([{ id, email, role: "agent", active: true, suspended: false }]);
    await enviarEmailTicketExistente(123, "Texto\nLinha 2", email);
    const call = fetchMock.mock.calls[2];
    const init = call?.[1];
    const payload = JSON.parse(String(init?.body));
    expect(payload.ticket.comment).toEqual({ author_id: id, public: true, html_body: "Texto<br>Linha 2" });
    expect(payload.ticket.tags).toEqual(["chamado_kithub", "existente", "chamado_kithub_enviado"]);
    expect(payload.ticket).not.toHaveProperty("assignee_id");
  });

  it("aceita correspondência exata sem diferenciar maiúsculas", async () => {
    api([{ id: 123, email: "SAC@EXAMPLE.COM", role: "admin", active: true }]);
    expect(await agenteZendeskPorEmail(" sac@example.com ")).toBe(123);
  });

  it.each([
    { users: [] },
    { users: [{ id: 1, email: "julia.sales@formaturismo.com.br", role: "admin", active: true }] },
    { users: [{ id: 2, email: "sac@example.com", role: "end-user", active: true }] },
    { users: [{ id: 2, email: "sac@example.com", role: "agent", active: false }] },
    { users: [{ id: 2, email: "sac@example.com", role: "agent", active: true, suspended: true }] },
    { users: [{ id: 2, email: "sac@example.com", role: "agent", active: true }, { id: 3, email: "sac@example.com", role: "agent", active: true }] },
  ])("sem um único agente ativo correspondente não publica nem usa Julia como padrão (%j)", async ({ users }) => {
    const fetchMock = api(users);
    await expect(enviarEmailTicketExistente(123, "Mensagem", "sac@example.com")).rejects.toThrow("único agente ativo");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sem e-mail autenticado não publica", async () => {
    const fetchMock = api([]);
    await expect(enviarEmailTicketExistente(123, "Mensagem", "")).rejects.toThrow("identificar o e-mail");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});