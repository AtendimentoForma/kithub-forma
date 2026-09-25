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
  const [motivoCanc, setMotivoCanc] = useState("");
  const [valor, setValor] = useState(chamado.valorFrete?.toString() ?? "");
  const [rastreio, setRastreio] = useState("");
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState({
    pax_nome: chamado.paxNome, cpf: chamado.cpf, pax_id: chamado.paxId,
    responsavel: chamado.responsavel, endereco: chamado.endereco,
  });

  const isSac = perfil === "sac" || perfil === "admin";
  const isLoja = perfil === "lojinha" || perfil === "admin";
  const st = chamado.status;

  async function run(fn: () => Promise<void>) {
    setErro(""); setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["chamados"] });
      await qc.invalidateQueries({ queryKey: ["movimentacoes", chamado.numero] });
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

  if (isSac && (st === "NOVO CHAMADO" || st === "EM ANÁLISE" || st === "AGUARDANDO CLIENTE")) {
    const checks = [
      ["conf_dados", "confDados", "Conferir dados do Pax"],
      ["conf_envio", "confEnvio", "Conferir envio original"],
      ["conf_motivo", "confMotivo", "Conferir motivo da solicitação"],
    ] as const;
    const tudoConferido = chamado.confDados && chamado.confEnvio && chamado.confMotivo;
    acoes = (
      <div className="space-y-3">
        <h4 className="font-semibold">Etapa 3 — Análise do SAC</h4>
        {st === "NOVO CHAMADO" && (
          <button disabled={busy} className={primary} onClick={() => go({}, "Chamado recebido — análise iniciada.", "EM ANÁLISE")}>Iniciar análise</button>
        )}
        {st !== "NOVO CHAMADO" && (
          <>
            <div className="space-y-1">
              {checks.map(([col, key, label]) => (
                <label key={col} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" disabled={busy} checked={chamado[key]} onChange={(e) => go({ [col]: e.target.checked }, null, null)} />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {st !== "AGUARDANDO CLIENTE"
                ? <button disabled={busy} className={outline} onClick={() => go({}, "Contato com o cliente iniciado.", "AGUARDANDO CLIENTE")}>Entrar em contato com cliente</button>
                : <button disabled={busy} className={outline} onClick={() => go({}, "Retorno do cliente recebido.", "EM ANÁLISE")}>Cliente retornou</button>}
              <button disabled={busy} className={outline} onClick={() => setEditando((v) => !v)}>Atualização de dados</button>
            </div>
            {editando && (
              <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                {([["pax_nome", "Passageiro"], ["cpf", "CPF"], ["pax_id", "ID Pax"], ["responsavel", "Responsável"]] as const).map(([k, l]) => (
                  <label key={k} className="text-xs text-muted-foreground">{l}
                    <input className={input} maxLength={200} value={dados[k]} onChange={(e) => setDados({ ...dados, [k]: e.target.value })} />
                  </label>
                ))}
                <label className="col-span-2 text-xs text-muted-foreground">Endereço
                  <input className={input} maxLength={500} value={dados.endereco} onChange={(e) => setDados({ ...dados, endereco: e.target.value })} />
                </label>
                <button disabled={busy} className={`${primary} col-span-2`} onClick={() => {
                  if (Object.values(dados).some((v) => !v.trim())) { setErro("Preencha todos os dados."); return; }
                  const t = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, v.trim()]));
                  go(t, "Dados do chamado atualizados pelo SAC.", null).then(() => setEditando(false));
                }}>Salvar dados</button>
              </div>
            )}
            <div className="rounded-md border p-3">
              <div className="mb-2 text-sm font-medium">Requer reenvio?</div>
              {!tudoConferido && <p className="mb-2 text-xs text-muted-foreground">Conclua a conferência acima para decidir.</p>}
              <textarea className={input} rows={2} maxLength={500} value={motivoCanc} onChange={(e) => setMotivoCanc(e.target.value)}
                placeholder="Se NÃO: motivo do cancelamento do reenvio (viagem cancelada, retirada presencial, etc.) — obrigatório" />
              <div className="mt-2 flex gap-2">
                <button disabled={busy || !tudoConferido} className={primary} onClick={() => go({ requer_reenvio: true }, "Reenvio necessário — seguir para cobrança de frete.", "EM ANÁLISE")}>Sim, requer reenvio</button>
                <button disabled={busy || !tudoConferido} className={outline} onClick={() => {
                  if (!motivoCanc.trim()) { setErro("Informe o motivo do cancelamento do reenvio."); return; }
                  go({ requer_reenvio: false, motivo_cancelamento: motivoCanc.trim() }, `Reenvio não necessário: ${motivoCanc.trim()}`, "CONCLUÍDO");
                }}>Não requer</button>
              </div>
            </div>
            {chamado.requerReenvio === true && st === "EM ANÁLISE" && (
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
            )}
          </div>
        )}
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
