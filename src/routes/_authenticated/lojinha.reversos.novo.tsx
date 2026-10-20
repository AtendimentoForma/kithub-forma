import { createFileRoute } from "@tanstack/react-router";
import { ReversoForm } from "@/components/ReversoForm";
export const Route = createFileRoute("/_authenticated/lojinha/reversos/novo")({
  head: () => ({ meta: [{ title: "Novo reverso — lojinha — KitHub" }, { name: "description", content: "Registro de reverso de kit pelo lojinha." }, { property: "og:title", content: "Novo reverso — lojinha — KitHub" }, { property: "og:description", content: "Registro de reverso de kit pelo lojinha." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ReversoForm perfil="lojinha" />,
});
