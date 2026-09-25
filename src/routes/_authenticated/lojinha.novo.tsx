import { createFileRoute } from "@tanstack/react-router";
import { NovoChamadoForm } from "@/components/NovoChamadoForm";

export const Route = createFileRoute("/_authenticated/lojinha/novo")({
  head: () => ({
    meta: [
      { title: "Novo chamado — Lojinha — KitHub" },
      { name: "description", content: "Abertura de chamado de reenvio de kit de passageiro." },
      { property: "og:title", content: "Novo chamado — Lojinha" },
      { property: "og:description", content: "Abertura de chamado de reenvio de kit de passageiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NovoChamadoForm listaPath="/lojinha/chamados" />,
});
