import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { RelatorioMotivos } from "@/components/RelatorioMotivos";

export const Route = createFileRoute("/_authenticated/sac/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatório de motivos — KitHub" },
      { name: "description", content: "Motivos das solicitações de reenvio, em ordem de frequência." },
      { property: "og:title", content: "Relatório de motivos — KitHub" },
      { property: "og:description", content: "Motivos das solicitações de reenvio, em ordem de frequência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Shell title="Relatório de motivos" perfil="sac">
      <RelatorioMotivos />
    </Shell>
  ),
});
