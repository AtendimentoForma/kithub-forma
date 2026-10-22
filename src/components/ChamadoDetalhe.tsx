import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";
import { StatusBadge } from "@/components/Shell";
import { FluxoChamado } from "@/components/FluxoChamado";
import { STATUS_LIDERANCA, statusSelecionaveis, formatNumero, movimentacoesQuery, addMovimentacao, getMyRole, marcarChamadoVisto, chamadoNaoVisto, MARCA_NAO_LIDO, ultimasMovimentacoesQuery, leiturasQuery, mensagemDeErro, minhasPermissoesQuery, podeEditar, type Chamado, type Status } from "@/lib/chamados";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChamadoDetalhe({ chamado, onClose }: { chamado: Chamado; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: movs = [] } = useQuery(movimentacoesQuery(chamado.numero));
  const { data: ultimas } = useQuery(ultimasMovimentacoesQuery);
  const { data: leituras } = useQuery(leiturasQuery);
  const { data: perfil = null } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const { data: permissoes } = useQuery(minhasPermissoesQuery);
  const podeMovimentar = podeEditar(perfil, permissoes, "chamados") || podeEditar(perfil, permissoes, "reenvios") || podeEditar(perfil, permissoes, "pagamentos");
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState<Status>(chamado.status);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const ultima = ultimas?.[chamado.numero];
    if (!chamadoNaoVisto(chamado, ultima, leituras)) return;
    marcarChamadoVisto(chamado.numero, ultima?.criadoEm ?? chamado.criadoEm)
      .then(() => qc.invalidateQueries({ queryKey: ["chamado-leituras"] }))
      .catch((error) => console.error("Não foi possível marcar o chamado como visto.", error));
  }, [chamado.numero, chamado.status, chamado.criadoEm, chamado.solicitanteId, ultimas, leituras, qc]);

  async function marcarNaoLido() {
    try {
      await marcarChamadoVisto(chamado.numero, MARCA_NAO_LIDO);
      onClose();
      await qc.invalidateQueries({ queryKey: ["chamado-leituras"] });
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível marcar como não lido."); }
  }

  async function enviar() {
    setErro("");
    if (["CONCLUÍDO", "REENVIO AUTORIZADO", "AGUARDANDO CLIENTE", STATUS_LIDERANCA].includes(status) && !texto.trim()) { setErro(`Para marcar como "${status}", escreva uma movimentação explicando o motivo.`); return; }
    if (!texto.trim() && status === chamado.status) { setErro("Escreva uma mensagem ou altere o status."); return; }
    setEnviando(true);
    try {
      await addMovimentacao(chamado.numero, texto.trim() || null, status !== chamado.status ? status : null);
      setTexto("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["chamados"] }),
        qc.invalidateQueries({ queryKey: ["movimentacoes", chamado.numero] }),
        qc.invalidateQueries({ queryKey: ["ultimas-movimentacoes"] }),
      ]);
    } catch (e) {
      setErro(mensagemDeErro(e, "Erro ao registrar movimentação."));
    } finally { setEnviando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-3 backdrop-blur-sm sm:p-5" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Chamado ${formatNumero(chamado.numero)}`} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-card p-5 shadow-xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b pb-5">
          <div className="min-w-0"><p className="text-xs font-semibold text-primary">DETALHES DO CHAMADO</p><h2 className="mt-1 text-xl font-bold">Chamado {formatNumero(chamado.numero)}</h2></div>
          <div className="flex items-center gap-2"><StatusBadge status={chamado.status} /><Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button></div>
        </div>
        <dl className="mt-5 grid gap-4 rounded-xl bg-muted/45 p-4 text-sm sm:grid-cols-2">
          {([
            ["Aberto em", new Date(chamado.criadoEm).toLocaleString("pt-BR")],
            ["Solicitante", chamado.solicitante],
            ["Passageiro", chamado.paxNome], ["CPF", chamado.cpf],
            ["ID Pax", chamado.paxId], ["ID Delivery", chamado.idDelivery ?? "—"],
            ["Responsável", chamado.responsavel],
            ["Destino", chamado.destino ?? "—"], ["Ano", chamado.ano ?? "—"],
            ["Rastreio Mandaê", chamado.rastreio], ["Data do envio", chamado.dataEnvio],
          ] as const).map(([k, v]) => (
            <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
          <div className="col-span-2"><dt className="text-muted-foreground">Endereço</dt><dd className="font-medium">{chamado.endereco}</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">Motivo</dt><dd className="font-medium">{chamado.motivos.join(", ")}{chamado.motivoOutro ? ` — ${chamado.motivoOutro}` : ""}{chamado.motivoCorreios && chamado.motivos.includes("Envio correios") ? ` — Envio correios: ${chamado.motivoCorreios}` : ""}</dd></div>
          {chamado.origemSolicitacao && <div className="col-span-2"><dt className="text-muted-foreground">Origem da solicitação</dt><dd className="font-medium">{chamado.origemSolicitacao}</dd></div>}
          {chamado.observacao && <div className="col-span-2"><dt className="text-muted-foreground">Observação</dt><dd>{chamado.observacao}</dd></div>}
          {chamado.anexos.length > 0 && <div className="col-span-2"><dt className="text-muted-foreground">Anexos</dt><dd>{chamado.anexos.join(", ")}</dd></div>}
        </dl>

        <FluxoChamado key={`${chamado.numero}-${chamado.status}`} chamado={chamado} perfil={perfil} />

        <h3 className="mt-7 mb-4 text-lg font-bold">Histórico do chamado</h3>
        <ol className="relative ml-2 space-y-5 border-l border-primary/35 pl-6 text-sm">
          <li className="relative"><span className="absolute -left-[2.05rem] top-0 grid h-4 w-4 place-items-center rounded-full bg-primary ring-4 ring-card"><Clock3 className="h-2.5 w-2.5 text-primary-foreground" /></span><span className="text-xs text-muted-foreground">{new Date(chamado.criadoEm).toLocaleString("pt-BR")} · {chamado.solicitante}{(() => { const pf = movs.find((m) => m.autor_nome === chamado.solicitante)?.perfil; return pf ? ` (${pf})` : ""; })()}</span><div className="mt-1 font-medium">Chamado aberto — NOVO CHAMADO</div></li>
          {movs.map((m) => (
            <li key={m.id} className="relative"><span className="absolute -left-[1.84rem] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
              <span className="text-xs text-muted-foreground">{new Date(m.criado_em).toLocaleString("pt-BR")} · {m.autor_nome} ({m.perfil})</span>
              {m.status_novo && <div className="mt-1 font-semibold">Status: {m.status_anterior} → {m.status_novo}</div>}
              {m.texto && <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{m.texto}</div>}
            </li>
          ))}
        </ol>

        {podeMovimentar ? (
        <div className="mt-6 space-y-3 rounded-xl border bg-muted/25 p-4">
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Adicionar informação ao chamado..." />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="rounded-md border bg-background px-2 py-1 text-sm">
              {statusSelecionaveis(perfil).map((s) => <option key={s} value={s}>{s}</option>)}
              {!statusSelecionaveis(perfil).includes(chamado.status) && <option value={chamado.status} disabled>{chamado.status}</option>}
            </select>
            <Button disabled={enviando} onClick={enviar} className="ml-auto">
              {enviando ? "Enviando..." : "Registrar movimentação"}
            </Button>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        ) : (
          <p className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">Seu acesso é somente de consulta. Você pode visualizar o chamado, mas não registrar movimentações.</p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={marcarNaoLido}>Marcar como não lido</Button>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
