import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { ChamadoDetalhe } from "@/components/ChamadoDetalhe";
import { STATUSES_SAC as STATUSES, STATUS_LABEL, chamadosQuery, formatNumero, updateStatus, type Status } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/sac/chamados")({
  validateSearch: (s: Record<string, unknown>): { status?: Status } =>
    STATUSES.includes(s["status"] as Status) ? { status: s["status"] as Status } : {},
  head: () => ({
    meta: [
      { title: "Chamados — SAC — Reenvio de Kits Pax" },
      { name: "description", content: "Listagem e movimentação dos chamados de reenvio pelo SAC." },
      { property: "og:title", content: "Chamados — SAC" },
      { property: "og:description", content: "Listagem e movimentação dos chamados de reenvio pelo SAC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lista,
});

function Lista() {
  const qc = useQueryClient();
  const { status } = Route.useSearch();
  const { data: list = [], isLoading } = useQuery(chamadosQuery);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState<number | null>(null);
  const abertoChamado = list.find((c) => c.numero === aberto);
  const filtrados = status ? list.filter((c) => c.status === status) : list;
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`;

  async function mudar(numero: number, novoStatus: Status) {
    setErro("");
    if (["CONCLUÍDO", "REENVIO AUTORIZADO", "AGUARDANDO CLIENTE", "ANÁLISE LIDERANÇA"].includes(novoStatus)) {
      setErro(`Para marcar como "${novoStatus}", abra o chamado e escreva a observação.`);
      setAberto(numero);
      return;
    }
    try {
      await updateStatus(numero, novoStatus);
      await qc.invalidateQueries({ queryKey: ["chamados"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar status.");
    }
  }

  return (
    <Shell title="Chamados — SAC" perfil="sac">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link to="/sac/chamados" search={{}} className={pill(!status)}>Todos ({list.length})</Link>
        {STATUSES.map((s) => (
          <Link key={s} to="/sac/chamados" search={{ status: s }} className={pill(status === s)}>
            {STATUS_LABEL[s]} ({list.filter((c) => c.status === s).length})
          </Link>
        ))}
        {erro && <span className="text-sm text-destructive">{erro}</span>}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr><th className="p-3">Nº</th><th className="p-3">Passageiro</th><th className="p-3">Motivo</th><th className="p-3">Solicitante</th><th className="p-3">Abertura</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.numero} onClick={() => setAberto(c.numero)} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                <td className="p-3 font-mono font-semibold">{formatNumero(c.numero)}</td>
                <td className="p-3">{c.paxNome}</td>
                <td className="p-3">{c.motivos.join(", ")}</td>
                <td className="p-3">{c.solicitante}</td>
                <td className="p-3">{new Date(c.criadoEm).toLocaleString("pt-BR")}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <select value={c.status} onChange={(e) => mudar(c.numero, e.target.value as Status)} className="rounded-md border bg-background px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && filtrados.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum chamado encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
      {abertoChamado && <ChamadoDetalhe chamado={abertoChamado} onClose={() => setAberto(null)} />}
    </Shell>
  );
}
