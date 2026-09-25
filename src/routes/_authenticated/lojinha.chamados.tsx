import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, StatusBadge } from "@/components/Shell";
import { ChamadoDetalhe } from "@/components/ChamadoDetalhe";
import { useQuery } from "@tanstack/react-query";
import { STATUSES, STATUS_LABEL, chamadosQuery, formatNumero, type Status, type Chamado } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/lojinha/chamados")({
  validateSearch: (s: Record<string, unknown>): { status?: Status } =>
    (STATUSES as readonly string[]).includes(s["status"] as Status) ? { status: s["status"] as Status } : {},
  head: () => ({
    meta: [
      { title: "Chamados — KitHub" },
      { name: "description", content: "Listagem e acompanhamento dos chamados de reenvio." },
      { property: "og:title", content: "Chamados da Lojinha" },
      { property: "og:description", content: "Listagem e acompanhamento dos chamados de reenvio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

      {aberto && <ChamadoDetalhe chamado={list.find((c) => c.numero === aberto.numero) ?? aberto} onClose={() => setAberto(null)} />}
    </Shell>
  );
}
