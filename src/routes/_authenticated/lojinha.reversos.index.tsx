import { createFileRoute } from "@tanstack/react-router";
import { Reversos } from "@/components/Reversos";
import { reversosQuery } from "@/lib/reversos";
export const Route = createFileRoute("/_authenticated/lojinha/reversos/")({
  validateSearch: (search: Record<string, unknown>) => ({ numero: Number.isSafeInteger(Number(search.numero)) && Number(search.numero) > 0 ? Number(search.numero) : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reversosQuery),
  head: () => ({ meta: [{ title: "Reversos — lojinha — KitHub" }, { name: "description", content: "Registros de reversos de kits de passageiros — lojinha." }, { property: "og:title", content: "Reversos — lojinha — KitHub" }, { property: "og:description", content: "Registros de reversos de kits de passageiros — lojinha." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Lista,
});
function Lista() { const { numero } = Route.useSearch(); return <Reversos perfil="lojinha" numero={numero} />; }
