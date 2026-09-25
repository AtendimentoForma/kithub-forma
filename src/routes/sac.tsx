import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sac")({
  head: () => ({
    meta: [
      { title: "Área SAC — Reenvio de Kits Pax" },
      { name: "description", content: "Área do SAC para análise de chamados de reenvio." },
      { property: "og:title", content: "Área SAC — Reenvio de Kits Pax" },
      { property: "og:description", content: "Área do SAC para análise de chamados de reenvio." },
    ],
  }),
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">Área do SAC</h1>
        <p className="mt-2 text-muted-foreground">Disponível na próxima etapa do projeto.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Voltar</Link>
      </div>
    </div>
  ),
});
