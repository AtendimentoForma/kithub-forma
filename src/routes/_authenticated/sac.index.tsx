import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ChamadosRecentes } from "@/components/ChamadosRecentes";
import { StatCard } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";
import { Plus, PackageOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { STATUSES_SAC as STATUSES, STATUS_LABEL, STATUS_ICONE, chamadosQuery } from "@/lib/chamados";
import { reversosQuery } from "@/lib/reversos";

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
  const { data: reversos = [] } = useQuery(reversosQuery);
  return (
    <Shell title="Visão Geral SAC" perfil="sac">
      <div className="mb-6 flex justify-end"><Button asChild><Link to="/sac/novo"><Plus /> Novo chamado</Link></Button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {STATUSES.map((s) => {
          const Icone = STATUS_ICONE[s];
          return (
            <StatCard key={s} to="/sac/chamados" search={{ status: s }} icon={Icone} value={list.filter((c) => c.status === s).length} label={STATUS_LABEL[s]} featured={s === "NOVO CHAMADO"} />
          );
        })}
        <StatCard to="/sac/reversos" search={{}} icon={PackageOpen} value={reversos.length} label="Reversos" />
      </div>
      <h2 className="mb-4 mt-10 text-xl font-bold">Chamados recentes</h2>
      <ChamadosRecentes />
    </Shell>
  );
}
