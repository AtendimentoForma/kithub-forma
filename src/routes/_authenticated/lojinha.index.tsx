import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Shell, StatusBadge } from "@/components/Shell";
import { STATUSES, STATUS_LABEL, formatNumero } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/lojinha/")({
  head: () => ({
    meta: [
      { title: "Dashboard Lojinha — Reenvio de Kits Pax" },
      { name: "description", content: "Visão geral dos chamados de reenvio da Lojinha." },
      { property: "og:title", content: "Dashboard Lojinha" },
      { property: "og:description", content: "Visão geral dos chamados de reenvio da Lojinha." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const list = chamadosQuery();
  return (
    <Shell title="Dashboard da Lojinha">
      <div className="mb-6 flex justify-end">
        <Link to="/lojinha/novo" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Novo chamado
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <Link key={s} to="/lojinha/chamados" search={{ status: s }} className="rounded-xl border bg-background p-4 hover:border-primary">
            <div className="text-3xl font-bold">{list.filter((c) => c.status === s).length}</div>
            <div className="mt-1 text-xs text-muted-foreground">{STATUS_LABEL[s]}</div>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Chamados recentes</h2>
      <div className="rounded-xl border bg-background">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum chamado ainda.</p>
        ) : (
          list.slice(0, 5).map((c) => (
            <div key={c.numero} className="flex items-center justify-between border-b p-4 last:border-0">
              <div>
                <span className="font-mono font-semibold">{formatNumero(c.numero)}</span>
                <span className="ml-3">{c.paxNome}</span>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
