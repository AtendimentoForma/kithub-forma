import { createFileRoute } from "@tanstack/react-router";
import { NovoChamadoForm } from "@/components/NovoChamadoForm";

export const Route = createFileRoute("/_authenticated/sac/novo")({
  head: () => ({
    meta: [
      { title: "Novo chamado — SAC — KitHub" },
      { name: "description", content: "Abertura de chamado de reenvio de kit de passageiro pelo SAC." },
      { property: "og:title", content: "Novo chamado — SAC" },
      { property: "og:description", content: "Abertura de chamado de reenvio de kit de passageiro pelo SAC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NovoChamadoForm listaPath="/sac/chamados" />,
});
