import { createFileRoute } from "@tanstack/react-router";
import { Reversos } from "@/components/Reversos";
import { reversosQuery } from "@/lib/reversos";
export const Route = createFileRoute("/_authenticated/sac/reversos/")({
  validateSearch: (search: Record<string, unknown>) => ({ numero: Number.isSafeInteger(Number(search.numero)) && Number(search.numero) > 0 ? Number(search.numero) : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reversosQuery),
  head: () => ({ meta: [{ title: "Reversos — sac — KitHub" }, { name: "description", content: "Registros de reversos de kits de passageiros — sac." }, { property: "og:title", content: "Reversos — sac — KitHub" }, { property: "og:description", content: "Registros de reversos de kits de passageiros — sac." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Lista,
});
function Lista() { const { numero } = Route.useSearch(); return <Reversos perfil="sac" numero={numero} />; }
