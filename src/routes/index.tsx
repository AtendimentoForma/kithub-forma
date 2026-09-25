import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Headset } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KitHub — Acesso" },
      { name: "description", content: "Sistema de chamados para reenvio de kits de passageiros." },
      { property: "og:title", content: "KitHub" },
      { property: "og:description", content: "Sistema de chamados para reenvio de kits de passageiros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">KitHub</h1>
        <p className="mt-2 text-muted-foreground">Sistema de chamados para reenvio de kits de passageiros</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link to="/auth" search={{ perfil: "lojinha" }} className="rounded-xl border bg-background p-8 transition hover:border-primary hover:shadow-sm">
            <Store className="mx-auto h-10 w-10 text-primary" />
            <div className="mt-4 text-lg font-semibold">Lojinha</div>
            <p className="mt-1 text-sm text-muted-foreground">Abrir e acompanhar chamados de reenvio</p>
          </Link>
          <Link to="/auth" search={{ perfil: "sac" }} className="rounded-xl border bg-background p-8 transition hover:border-primary hover:shadow-sm">
            <Headset className="mx-auto h-10 w-10 text-primary" />
            <div className="mt-4 text-lg font-semibold">SAC</div>
            <p className="mt-1 text-sm text-muted-foreground">Análise e tratativa dos chamados</p>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Escolha seu perfil para entrar com e-mail e senha</p>
      </div>
    </div>
  );
}
