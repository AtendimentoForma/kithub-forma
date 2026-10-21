import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, PackageOpen } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ChamadosRecentes } from "@/components/ChamadosRecentes";
import { StatCard } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { STATUSES, STATUS_LABEL, STATUS_ICONE, STATUS_PRIO_ENTREGA, chamadosQuery, leiturasQuery, ultimasMovimentacoesQuery, chamadoNaoVisto } from "@/lib/chamados";
import { reversosQuery } from "@/lib/reversos";

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
  const { data: reversos = [] } = useQuery(reversosQuery);
  const { data: ultimas = {} } = useQuery(ultimasMovimentacoesQuery);
  const { data: leituras } = useQuery(leiturasQuery);
  return (
    <Shell title="Visão Geral Lojinha">
      <div className="mb-6 flex justify-end">
        <Button asChild><Link to="/lojinha/novo"><Plus /> Novo chamado</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {STATUSES.map((s) => {
          const Icone = STATUS_ICONE[s];
          const total = list.filter((c) => c.status === s && chamadoNaoVisto(c, ultimas[c.numero], leituras)).length;
          const existe = list.some((c) => c.status === s);
          const prioridade = s === STATUS_PRIO_ENTREGA;
          return (
            <StatCard key={s} to="/lojinha/chamados" search={{ status: s }} icon={Icone} value={total} label={STATUS_LABEL[s]} featured={s === "NOVO CHAMADO"} urgente={prioridade && existe} centralizado={prioridade} />
          );
        })}
        <StatCard to="/lojinha/reversos" search={{}} icon={PackageOpen} value={0} label="Reversos" />
      </div>
      <h2 className="mb-4 mt-10 text-xl font-bold">Chamados recentes</h2>
      <ChamadosRecentes />
    </Shell>
  );
}
