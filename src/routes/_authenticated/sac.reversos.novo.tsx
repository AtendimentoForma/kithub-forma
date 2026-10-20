import { createFileRoute } from "@tanstack/react-router";
import { ReversoForm } from "@/components/ReversoForm";
export const Route = createFileRoute("/_authenticated/sac/reversos/novo")({
  head: () => ({ meta: [{ title: "Novo reverso — sac — KitHub" }, { name: "description", content: "Registro de reverso de kit pelo sac." }, { property: "og:title", content: "Novo reverso — sac — KitHub" }, { property: "og:description", content: "Registro de reverso de kit pelo sac." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ReversoForm perfil="sac" />,
});
