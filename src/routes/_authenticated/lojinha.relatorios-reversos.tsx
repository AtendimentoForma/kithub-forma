import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { RelatorioReversos } from "@/components/RelatorioReversos";

export const Route = createFileRoute("/_authenticated/lojinha/relatorios-reversos")({
  head: () => ({
    meta: [
      { title: "Relatórios de reversos — Lojinha — KitHub" },
      { name: "description", content: "Resumo, motivos, locais e pedidos parados dos reversos." },
      { property: "og:title", content: "Relatórios de reversos — Lojinha — KitHub" },
      { property: "og:description", content: "Resumo, motivos, locais e pedidos parados dos reversos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Shell title="Relatórios" perfil="lojinha">
      <RelatorioReversos perfil="lojinha" />
    </Shell>
  ),
});
