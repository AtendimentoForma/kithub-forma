import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ChamadosRecentes } from "@/components/ChamadosRecentes";
import { StatCard } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { STATUSES, STATUS_LABEL, STATUS_ICONE, chamadosQuery } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/lojinha/")({
  head: () => ({
    meta: [
      { title: "Dashboard Lojinha — KitHub" },
      { name: "description", content: "Visão geral dos chamados de reenvio da Lojinha." },
      { property: "og:title", content: "Dashboard Lojinha" },
      { property: "og:description", content: "Visão geral dos chamados de reenvio da Lojinha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: list = [] } = useQuery(chamadosQuery);
  return (
    <Shell title="Visão Geral Lojinha">
      <div className="mb-6 flex justify-end">
        <Button asChild><Link to="/lojinha/novo"><Plus /> Novo chamado</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {STATUSES.map((s) => {
          const Icone = STATUS_ICONE[s];
          return (
            <StatCard key={s} to="/lojinha/chamados" search={{ status: s }} icon={Icone} value={list.filter((c) => c.status === s).length} label={STATUS_LABEL[s]} featured={s === "NOVO CHAMADO"} />
          );
        })}
      </div>
      <h2 className="mb-4 mt-10 text-xl font-bold">Chamados recentes</h2>
      <ChamadosRecentes />
    </Shell>
  );
}
