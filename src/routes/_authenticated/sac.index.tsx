import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ChamadosRecentes } from "@/components/ChamadosRecentes";
import { useQuery } from "@tanstack/react-query";
import { STATUSES_SAC as STATUSES, STATUS_LABEL, chamadosQuery } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/sac/")({
  head: () => ({
    meta: [
      { title: "Dashboard SAC — KitHub" },
      { name: "description", content: "Visão geral dos chamados de reenvio para o SAC." },
      { property: "og:title", content: "Dashboard SAC" },
      { property: "og:description", content: "Visão geral dos chamados de reenvio para o SAC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: list = [] } = useQuery(chamadosQuery);
  return (
    <Shell title="Dashboard do SAC" perfil="sac">
      <Link to="/sac/novo" className="mb-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">+ Novo chamado</Link>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {STATUSES.map((s) => (
          <Link key={s} to="/sac/chamados" search={{ status: s }} className="rounded-xl border bg-background p-4 hover:border-primary">
            <div className="text-3xl font-bold">{list.filter((c) => c.status === s).length}</div>
            <div className="mt-1 text-xs text-muted-foreground">{STATUS_LABEL[s]}</div>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Chamados recentes</h2>
      <ChamadosRecentes />
    </Shell>
  );
}
