import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { atualizarFluxo, despacharChamado, type Chamado, type Perfil, type Status } from "@/lib/chamados";

const COBRANCA = ["Endereço incorreto", "Cliente ausente", "Troca de tamanho"];
const SEM_COBRANCA = ["Produto errado", "Produto com avaria", "Pedido extraviado"];

const btn = "rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-50";
const primary = `${btn} bg-primary text-primary-foreground`;
const outline = `${btn} border bg-background hover:bg-accent`;
const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";

export function FluxoChamado({ chamado, perfil }: { chamado: Chamado; perfil: Perfil | null }) {
  const qc = useQueryClient();
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [valor, setValor] = useState(chamado.valorFrete?.toString() ?? "");
  const [rastreio, setRastreio] = useState("");

  const isSac = perfil === "sac" || perfil === "admin";
  const isLoja = perfil === "lojinha" || perfil === "admin";
  const st = chamado.status;

  async function run(fn: () => Promise<void>) {
    setErro(""); setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["chamados"] });
      await qc.invalidateQueries({ queryKey: ["movimentacoes", chamado.numero] });
      await qc.invalidateQueries({ queryKey: ["ultimas-movimentacoes"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar o chamado.");
    } finally { setBusy(false); }
  }
  const go = (patch: Record<string, unknown>, texto: string | null, status: Status | null) =>
    run(() => atualizarFluxo(chamado.numero, patch, texto, status));

  const resumo = (
    <div className="grid gap-1 text-sm">
      {chamado.requerReenvio === false && <div><b>Reenvio não necessário:</b> {chamado.motivoCancelamento}</div>}
      {chamado.requerPagamento != null && (
        <div><b>Frete:</b> {chamado.requerPagamento ? `cobrado${chamado.valorFrete != null ? ` — R$ ${chamado.valorFrete.toFixed(2).replace(".", ",")}` : ""} · pagamento ${chamado.statusPagamento ?? "—"}` : "sem cobrança (exceção)"}</div>
      )}
      {chamado.novoRastreio && <div><b>Novo rastreio:</b> {chamado.novoRastreio} {chamado.despachadoEm && `(${new Date(chamado.despachadoEm).toLocaleString("pt-BR")})`}</div>}
    </div>
  );

  let acoes: React.ReactNode = null;

  if (isSac && chamado.requerReenvio === true && st === "EM ANÁLISE") {
    acoes = (
      <div className="rounded-md border p-3">
        <h4 className="mb-2 font-semibold">Etapa 4 — Requer pagamento de frete?</h4>
        <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
          <div><b>Com cobrança:</b> {COBRANCA.join(", ")}</div>
          <div><b>Sem cobrança (exceção):</b> {SEM_COBRANCA.join(", ")}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${input} w-32`} inputMode="decimal" placeholder="Valor R$" value={valor} onChange={(e) => setValor(e.target.value)} />
          <button disabled={busy} className={primary} onClick={() => {
            const v = Number(valor.replace(",", "."));
            if (!(v > 0) || v > 100000) { setErro("Informe um valor de frete válido."); return; }
            go({ requer_pagamento: true, valor_frete: v, status_pagamento: "PENDENTE" }, `Pagamento de frete solicitado: R$ ${v.toFixed(2).replace(".", ",")}`, "AGUARDANDO PAGAMENTO");
          }}>Sim, solicitar pagamento</button>
          <button disabled={busy} className={outline} onClick={() => go({ requer_pagamento: false, status_pagamento: null }, "Sem cobrança de frete — envio autorizado.", "REENVIO AUTORIZADO")}>Não, autorizar envio</button>
        </div>
      </div>
    );
  } else if (isSac && st === "AGUARDANDO PAGAMENTO") {
    acoes = (
      <div className="space-y-2">
        <h4 className="font-semibold">Etapa 4 — Status do pagamento: {chamado.statusPagamento ?? "PENDENTE"}</h4>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} className={primary} onClick={() => go({ status_pagamento: "RECEBIDO" }, "Pagamento recebido — envio autorizado.", "REENVIO AUTORIZADO")}>Pagamento recebido</button>
          <button disabled={busy} className={outline} onClick={() => go({ status_pagamento: "PENDENTE" }, "Pagamento ainda pendente — cliente cobrado novamente.", null)}>Continua pendente</button>
          <button disabled={busy} className={outline} onClick={() => go({ status_pagamento: "CANCELADO", motivo_cancelamento: "Pagamento cancelado" }, "Pagamento cancelado — reenvio não realizado.", "CONCLUÍDO")}>Pagamento cancelado</button>
        </div>
      </div>
    );
  } else if (isLoja && st === "REENVIO AUTORIZADO") {
    acoes = (
      <div className="space-y-2">
        <h4 className="font-semibold">Reenvio autorizado — despachar pedido</h4>
        <div className="flex gap-2">
          <input className={input} maxLength={100} placeholder="Novo nº de rastreio Mandaê" value={rastreio} onChange={(e) => setRastreio(e.target.value)} />
          <button disabled={busy} className={primary} onClick={() => {
            if (!rastreio.trim()) { setErro("Informe o novo nº de rastreio."); return; }
            run(() => despacharChamado(chamado.numero, rastreio.trim()));
          }}>Pedido despachado</button>
        </div>
      </div>
    );
  } else if (st === "REENVIO AUTORIZADO") {
    acoes = <p className="text-sm text-muted-foreground">Aguardando a Lojinha despachar o pedido.</p>;
  }

  if (!acoes && chamado.requerReenvio == null && chamado.requerPagamento == null && !chamado.novoRastreio) return null;

  return (
    <div className="mt-6 space-y-3 rounded-lg border bg-muted/30 p-4">
      {resumo}
      {acoes}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
