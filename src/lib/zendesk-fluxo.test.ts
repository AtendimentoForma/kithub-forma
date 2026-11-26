import { afterEach, describe, expect, it, vi } from "vitest";
import { criarTicketZendesk, enviarEmailTicketExistente } from "./zendesk.server";
import { AGENTE_ASSINATURA_ID } from "./zendesk-config";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function api() {
  vi.stubEnv("LOVABLE_API_KEY", "test-project");
  vi.stubEnv("ZENDESK_API_KEY", "test-connection");
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ ticket: { id: 123, tags: ["chamado_kithub", "porto_seguro", "22"], updated_at: "2026-11-26T19:51:53Z" } })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("criação interna e atualização pública Zendesk", () => {
  it.each([false, true])("criação nunca envia comentário público nem tag de enviado (opção %s)", async (enviarEmail) => {
    const fetchMock = api();
    await criarTicketZendesk({ numero: 19, paxId: "PAX19", responsavelEmail: "teste@example.com", responsavel: "Teste", destino: "Floripa", notaInterna: "Todos os dados internos", enviarEmail, emailTexto: "Mensagem privada do SAC" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("https://connector-gateway.lovable.dev/zendesk/api/v2/tickets");
    const init = call?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    const { ticket } = JSON.parse(String(init.body));
    expect(ticket.comment).toEqual({ body: "Todos os dados internos", public: false });
    expect(ticket.tags).toEqual(["chamado_kithub"]);
    expect(ticket.status).toBe("pending");
  });

  it("envio posterior atualiza o mesmo ticket com somente texto, quebras e tag adicional", async () => {
    const fetchMock = api();
    await enviarEmailTicketExistente(123, "Minha mensagem\nSegunda linha & detalhes");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBeUndefined();
    const call = fetchMock.mock.calls[1];
    expect(call?.[0]).toBe("https://connector-gateway.lovable.dev/zendesk/api/v2/tickets/123");
    const init = call?.[1] as RequestInit;
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ ticket: {
      comment: { html_body: "Minha mensagem<br>Segunda linha &amp; detalhes", public: true, ...(AGENTE_ASSINATURA_ID ? { author_id: AGENTE_ASSINATURA_ID } : {}) },
      tags: ["chamado_kithub", "porto_seguro", "22", "chamado_kithub_enviado"],
      safe_update: true,
      updated_stamp: "2026-11-26T19:51:53Z",
    } });
  });

  it("não publica mensagem se a leitura das tags falhar", async () => {
    const fetchMock = api();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ticket: { id: 123 } })));
    await expect(enviarEmailTicketExistente(123, "Minha mensagem")).rejects.toThrow("Nenhum e-mail foi enviado");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("não repete comentário automaticamente em conflito de atualização", async () => {
    const fetchMock = api();
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ ticket: { tags: ["chamado_kithub"], updated_at: "2026-11-26T19:51:53Z" } })));
    fetchMock.mockResolvedValueOnce(new Response("UpdateConflict", { status: 409 }));
    await expect(enviarEmailTicketExistente(123, "Minha mensagem")).rejects.toThrow("409");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});