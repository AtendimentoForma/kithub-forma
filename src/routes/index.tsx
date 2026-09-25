import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Headset } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reenvio de Kits Pax — Acesso" },
      { name: "description", content: "Sistema de chamados para reenvio de kits de passageiros." },
      { property: "og:title", content: "Reenvio de Kits Pax" },
      { property: "og:description", content: "Sistema de chamados para reenvio de kits de passageiros." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reenvio de Kits Pax</h1>
        <p className="mt-2 text-muted-foreground">Sistema de chamados para reenvio de kits de passageiros</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-8">
            <Store className="mx-auto h-10 w-10 text-primary" />
            <div className="mt-4 text-lg font-semibold">Lojinha</div>
            <p className="mt-1 text-sm text-muted-foreground">Abrir e acompanhar chamados de reenvio</p>
          </div>
          <div className="rounded-xl border bg-background p-8">
            <Headset className="mx-auto h-10 w-10 text-primary" />
            <div className="mt-4 text-lg font-semibold">SAC</div>
            <p className="mt-1 text-sm text-muted-foreground">Análise e tratativa dos chamados</p>
          </div>
        </div>
        <Link to="/auth" className="mt-8 inline-block rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Entrar</Link>
      </div>
    </div>
  );
}
