import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, StatusBadge } from "@/components/Shell";
import { useQuery } from "@tanstack/react-query";
import { STATUSES, STATUS_LABEL, chamadosQuery, formatNumero } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/sac/")({
  head: () => ({
    meta: [
      { title: "Dashboard SAC — Reenvio de Kits Pax" },
      { name: "description", content: "Visão geral dos chamados de reenvio para o SAC." },
      { property: "og:title", content: "Dashboard SAC" },
      { property: "og:description", content: "Visão geral dos chamados de reenvio para o SAC." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: list = [] } = useQuery(chamadosQuery);
  return (
    <Shell title="Dashboard do SAC" perfil="sac">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <Link key={s} to="/sac/chamados" search={{ status: s }} className="rounded-xl border bg-background p-4 hover:border-primary">
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
