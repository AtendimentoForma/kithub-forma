import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/Shell";
import { FluxoChamado } from "@/components/FluxoChamado";
import { STATUSES, formatNumero, movimentacoesQuery, addMovimentacao, getMyRole, marcarChamadoVisto, ultimasMovimentacoesQuery, leiturasQuery, type Chamado, type Status } from "@/lib/chamados";

export function ChamadoDetalhe({ chamado, onClose }: { chamado: Chamado; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: movs = [] } = useQuery(movimentacoesQuery(chamado.numero));
  const { data: ultimas } = useQuery(ultimasMovimentacoesQuery);
  const { data: leituras } = useQuery(leiturasQuery);
  const { data: perfil = null } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState<Status>(chamado.status);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const ultima = ultimas?.[chamado.numero];
    const vistoEm = leituras?.vistos[chamado.numero];
    if (!ultima || !leituras || ultima.autorId === leituras.usuarioId || (vistoEm && new Date(vistoEm).getTime() >= new Date(ultima.criadoEm).getTime())) return;
    let active = true;
    marcarChamadoVisto(chamado.numero, ultima.criadoEm)
      .then(() => { if (active) void qc.invalidateQueries({ queryKey: ["chamado-leituras"] }); })
      .catch((error) => console.error("Não foi possível marcar o chamado como visto.", error));
    return () => { active = false; };
  }, [chamado.numero, ultimas, leituras, qc]);

  async function enviar() {
    setErro("");
    if (["CONCLUÍDO", "REENVIO AUTORIZADO", "AGUARDANDO CLIENTE"].includes(status) && !texto.trim()) { setErro(`Para marcar como "${status}", escreva uma movimentação explicando o motivo.`); return; }
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
      setErro(e instanceof Error ? e.message : "Erro ao registrar movimentação.");
    } finally { setEnviando(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Chamado {formatNumero(chamado.numero)}</h2>
          <StatusBadge status={chamado.status} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {([
            ["Aberto em", new Date(chamado.criadoEm).toLocaleString("pt-BR")],
            ["Solicitante", chamado.solicitante],
            ["Passageiro", chamado.paxNome], ["CPF", chamado.cpf],
            ["ID Pax", chamado.paxId], ["Responsável", chamado.responsavel],
            ["Rastreio Mandaê", chamado.rastreio], ["Data do envio", chamado.dataEnvio],
          ] as const).map(([k, v]) => (
            <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
          <div className="col-span-2"><dt className="text-muted-foreground">Endereço</dt><dd className="font-medium">{chamado.endereco}</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">Motivo</dt><dd className="font-medium">{chamado.motivos.join(", ")}{chamado.motivoOutro ? ` — ${chamado.motivoOutro}` : ""}</dd></div>
          {chamado.origemSolicitacao && <div className="col-span-2"><dt className="text-muted-foreground">Origem da solicitação</dt><dd className="font-medium">{chamado.origemSolicitacao}</dd></div>}
          {chamado.observacao && <div className="col-span-2"><dt className="text-muted-foreground">Observação</dt><dd>{chamado.observacao}</dd></div>}
          {chamado.anexos.length > 0 && <div className="col-span-2"><dt className="text-muted-foreground">Anexos</dt><dd>{chamado.anexos.join(", ")}</dd></div>}
        </dl>

        <FluxoChamado key={`${chamado.numero}-${chamado.status}`} chamado={chamado} perfil={perfil} />

        <h3 className="mt-6 mb-2 font-semibold">Movimentações</h3>
        <ol className="space-y-2 border-l pl-4 text-sm">
          <li><span className="text-muted-foreground">{new Date(chamado.criadoEm).toLocaleString("pt-BR")} · {chamado.solicitante} (Lojinha)</span><div>Chamado aberto — NOVO CHAMADO</div></li>
          {movs.map((m) => (
            <li key={m.id}>
              <span className="text-muted-foreground">{new Date(m.criado_em).toLocaleString("pt-BR")} · {m.autor_nome} ({m.perfil})</span>
              {m.status_novo && <div className="font-medium">Status: {m.status_anterior} → {m.status_novo}</div>}
              {m.texto && <div className="whitespace-pre-wrap">{m.texto}</div>}
            </li>
          ))}
        </ol>

        <div className="mt-4 space-y-2 rounded-lg border p-3">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Adicionar informação ao chamado..." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="rounded-md border bg-background px-2 py-1 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button disabled={enviando} onClick={enviar} className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {enviando ? "Enviando..." : "Registrar movimentação"}
            </button>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-md border px-4 py-2 text-sm hover:bg-accent">Fechar</button>
      </div>
    </div>
  );
}
