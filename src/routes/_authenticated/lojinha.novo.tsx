import { createFileRoute } from "@tanstack/react-router";
import { NovoChamadoForm } from "@/components/NovoChamadoForm";

export const Route = createFileRoute("/_authenticated/lojinha/novo")({
  head: () => ({
    meta: [
      { title: "Novo chamado — Reenvio de Kits Pax" },
      { name: "description", content: "Abertura de chamado de reenvio de kit de passageiro." },
      { property: "og:title", content: "Novo chamado de reenvio" },
      { property: "og:description", content: "Abertura de chamado de reenvio de kit de passageiro." },
    ],
  }),
  component: () => <NovoChamadoForm listaPath="/lojinha/chamados" />,
});
