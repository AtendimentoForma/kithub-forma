import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DELIVERY_TIMEOUT_MS, erroHttpDelivery, mapearPedidoDelivery, registro, validarIdDelivery, type ResultadoDelivery } from "./delivery-mapping";

// This boundary preserves 401 for the generated auth middleware's plain errors.
const deliverySessionBoundary = createMiddleware({ type: "function" }).server(async ({ next }) => {
  setResponseHeader("Cache-Control", "no-store");
  if (!getRequestHeader("authorization")) throw Object.assign(new Error("Sessão expirada. Entre novamente."), { statusCode: 401 });
  try { return await next(); } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) throw Object.assign(new Error("Sessão expirada. Entre novamente."), { statusCode: 401 });
    throw error;
  }
});
const deliveryAccess = createMiddleware({ type: "function" }).middleware([deliverySessionBoundary, requireSupabaseAuth]).server(async ({ context, next }) => {
  const [{ data: aprovado, error: erroAprovacao }, { data: papeis, error: erroPapeis }, { data: permissoes, error: erroPermissoes }] = await Promise.all([
    context.supabase.rpc("meu_status_aprovacao"),
    context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    context.supabase.from("user_permissoes").select("permissao").eq("user_id", context.userId),
  ]);
  const admin = papeis?.some(p => p.role === "admin");
  if (erroAprovacao || erroPapeis || erroPermissoes || !aprovado || (!admin && !(papeis?.some(p => p.role === "sac" || p.role === "lojinha") && permissoes?.some(p => p.permissao === "chamados" || p.permissao === "reenvios")))) {
    throw Object.assign(new Error("Você não tem permissão para buscar pedidos."), { statusCode: 403 });
  }
  return next();
});

export const buscarPedidoDelivery = createServerFn({ method: "POST" })
  .middleware([deliveryAccess])
  .inputValidator((input: { idDelivery: string }) => input)
  .handler(async ({ data, context, signal }): Promise<ResultadoDelivery> => {
    if (!validarIdDelivery(data?.idDelivery)) {
      setResponseStatus(400);
      return { ok: false, codigo: "INVALID_ID", mensagem: "Informe apenas números no ID Delivery." };
    }
    const base = process.env["DELIVERY_API_BASE_URL"];
    const token = process.env["DELIVERY_API_TOKEN"];
    if (!base || !token || !["https://delivery-api.formahomolog.com.br", "https://delivery-api.formaturismo.com.br"].includes(base)) {
      setResponseStatus(502); return erroHttpDelivery(401);
    }
    const inicio = Date.now();
    let http: number | null = null;
    const timeout = AbortSignal.timeout(DELIVERY_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}/pedidos/${data.idDelivery}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.any([signal, timeout]), redirect: "error",
      });
      http = response.status;
      if (!response.ok) {
        const erro = erroHttpDelivery(response.status);
        setResponseStatus(erro.codigo === "NOT_FOUND" ? 404 : 502); return erro;
      }
      const body: unknown = await response.json();
      const pedido = registro(registro(body).data).pedido;
      if (!pedido || !Object.keys(registro(pedido)).length) {
        setResponseStatus(404); return erroHttpDelivery(404);
      }
      return mapearPedidoDelivery(pedido);
    } catch {
      setResponseStatus(timeout.aborted ? 504 : 502); return erroHttpDelivery(503);
    } finally {
      console.info("Delivery lookup", { idDelivery: data.idDelivery, userId: context.userId, status: http, duration: Date.now() - inicio });
    }
  });

export const verificarChamadosDelivery = createServerFn({ method: "POST" })
  .middleware([deliveryAccess])
  .inputValidator((input: { idDelivery?: string; paxId?: string }) => input)
  .handler(async ({ context, data }) => {
    const resultado: { paxNumero?: number; deliveryNumero?: number } = {};
    if (validarIdDelivery(data?.idDelivery)) {
      const { data: chamados, error } = await context.supabase.from("chamados").select("numero").eq("id_delivery", data.idDelivery).order("numero", { ascending: false }).limit(1);
      if (error) throw new Error("Não foi possível verificar os chamados existentes.");
      if (chamados?.[0]) resultado.deliveryNumero = chamados[0].numero;
    }
    if (typeof data?.paxId === "string" && data.paxId.trim() && data.paxId.length <= 255) {
      const { data: chamados, error } = await context.supabase.from("chamados").select("numero, pax_id").neq("status", "CONCLUÍDO");
      if (error) throw new Error("Não foi possível verificar os chamados existentes.");
      const chamado = chamados?.find(c => c.pax_id.trim().toLocaleLowerCase("pt-BR") === data.paxId?.trim().toLocaleLowerCase("pt-BR"));
      if (chamado) resultado.paxNumero = chamado.numero;
    }
    return resultado;
  });