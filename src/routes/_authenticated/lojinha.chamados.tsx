import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, StatusBadge } from "@/components/Shell";
import { useQuery } from "@tanstack/react-query";
import { STATUSES, STATUS_LABEL, chamadosQuery, formatNumero, type Status, type Chamado } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/lojinha/chamados")({
  validateSearch: (s: Record<string, unknown>): { status?: Status } =>
    STATUSES.includes(s["status"] as Status) ? { status: s["status"] as Status } : {},
  head: () => ({
    meta: [
      { title: "Chamados — Reenvio de Kits Pax" },
      { name: "description", content: "Listagem e acompanhamento dos chamados de reenvio." },
      { property: "og:title", content: "Chamados da Lojinha" },
      { property: "og:description", content: "Listagem e acompanhamento dos chamados de reenvio." },
    ],
  }),
  component: Lista,
});

function Lista() {
  const { status } = Route.useSearch();
  const { data: list = [] } = useQuery(chamadosQuery);
  const [aberto, setAberto] = useState<Chamado | null>(null);
  const filtrados = status ? list.filter((c) => c.status === status) : list;
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`;

  return (
    <Shell title="Chamados">
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/lojinha/chamados" search={{}} className={pill(!status)}>Todos ({list.length})</Link>
        {STATUSES.map((s) => (
          <Link key={s} to="/lojinha/chamados" search={{ status: s }} className={pill(status === s)}>
            {STATUS_LABEL[s]} ({list.filter((c) => c.status === s).length})
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Nº</th><th className="p-3">Passageiro</th><th className="p-3">ID Pax</th>
              <th className="p-3">Rastreio</th><th className="p-3">Abertura</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.numero} onClick={() => setAberto(c)} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                <td className="p-3 font-mono font-semibold">{formatNumero(c.numero)}</td>
                <td className="p-3">{c.paxNome}</td>
                <td className="p-3">{c.paxId}</td>
                <td className="p-3">{c.rastreio}</td>
                <td className="p-3">{new Date(c.criadoEm).toLocaleString("pt-BR")}</td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum chamado encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setAberto(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Chamado {formatNumero(aberto.numero)}</h2>
              <StatusBadge status={aberto.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {([
                ["Aberto em", new Date(aberto.criadoEm).toLocaleString("pt-BR")],
                ["Solicitante", aberto.solicitante],
                ["Passageiro", aberto.paxNome], ["CPF", aberto.cpf],
                ["ID Pax", aberto.paxId], ["Responsável", aberto.responsavel],
                ["Rastreio Mandaê", aberto.rastreio], ["Data do envio", aberto.dataEnvio],
              ] as const).map(([k, v]) => (
                <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
              <div className="col-span-2"><dt className="text-muted-foreground">Endereço</dt><dd className="font-medium">{aberto.endereco}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Motivo</dt><dd className="font-medium">{aberto.motivos.join(", ")}{aberto.motivoOutro ? ` — ${aberto.motivoOutro}` : ""}</dd></div>
              {aberto.observacao && <div className="col-span-2"><dt className="text-muted-foreground">Observação</dt><dd>{aberto.observacao}</dd></div>}
              {aberto.anexos.length > 0 && <div className="col-span-2"><dt className="text-muted-foreground">Anexos</dt><dd>{aberto.anexos.join(", ")}</dd></div>}
            </dl>
            <button onClick={() => setAberto(null)} className="mt-6 w-full rounded-md border px-4 py-2 text-sm hover:bg-accent">Fechar</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
