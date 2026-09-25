import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { STATUSES, STATUS_LABEL, chamadosQuery, formatNumero, getMyRole, updateStatus, type Status } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/sac")({
  beforeLoad: async () => {
    const role = await getMyRole();
    if (role !== "sac") throw redirect({ to: role === "lojinha" ? "/lojinha" : "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Área SAC — Reenvio de Kits Pax" },
      { name: "description", content: "Área do SAC para análise de chamados de reenvio." },
      { property: "og:title", content: "Área SAC — Reenvio de Kits Pax" },
      { property: "og:description", content: "Área do SAC para análise de chamados de reenvio." },
    ],
  }),
  component: Sac,
});

function Sac() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery(chamadosQuery);
  const [filtro, setFiltro] = useState<Status | "">("");
  const [erro, setErro] = useState("");
  const filtrados = filtro ? list.filter((c) => c.status === filtro) : list;

  async function mudar(numero: number, status: Status) {
    setErro("");
    try {
      await updateStatus(numero, status);
      await qc.invalidateQueries({ queryKey: ["chamados"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar status.");
    }
  }

  return (
    <Shell title="Chamados — SAC" perfil="sac">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Status | "")} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Todos ({list.length})</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]} ({list.filter((c) => c.status === s).length})</option>)}
        </select>
        {erro && <span className="text-sm text-destructive">{erro}</span>}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr><th className="p-3">Nº</th><th className="p-3">Passageiro</th><th className="p-3">Motivo</th><th className="p-3">Solicitante</th><th className="p-3">Abertura</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.numero} className="border-b last:border-0">
                <td className="p-3 font-mono font-semibold">{formatNumero(c.numero)}</td>
                <td className="p-3">{c.paxNome}</td>
                <td className="p-3">{c.motivos.join(", ")}</td>
                <td className="p-3">{c.solicitante}</td>
                <td className="p-3">{new Date(c.criadoEm).toLocaleString("pt-BR")}</td>
                <td className="p-3">
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
    </Shell>
  );
}
