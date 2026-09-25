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
        <p className="mt-2 text-muted-foreground">Selecione seu perfil de acesso</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link to="/lojinha" className="rounded-xl border bg-background p-8 transition hover:border-primary hover:shadow-md">
            <Store className="mx-auto h-10 w-10 text-primary" />
            <div className="mt-4 text-lg font-semibold">Login Lojinha</div>
            <p className="mt-1 text-sm text-muted-foreground">Abrir e acompanhar chamados de reenvio</p>
          </Link>
          <Link to="/sac" className="rounded-xl border bg-background p-8 transition hover:border-primary hover:shadow-md">
            <Headset className="mx-auto h-10 w-10 text-primary" />
            <div className="mt-4 text-lg font-semibold">Login SAC</div>
            <p className="mt-1 text-sm text-muted-foreground">Análise e tratativa dos chamados</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
