import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headset, Store } from "lucide-react";
import { KitHubBrand, ThemeToggle } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "KitHub — Acesso" },
    { name: "description", content: "Sistema de chamados para reenvio de kits de passageiros." },
    { property: "og:title", content: "KitHub — Gestão de Controle" },
    { property: "og:description", content: "Sistema de chamados para reenvio de kits de passageiros." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Index,
});

const perfis = [
  { perfil: "lojinha" as const, title: "Lojinha", description: "Abrir e acompanhar chamados de reenvio", Icon: Store },
  { perfil: "sac" as const, title: "SAC", description: "Análise e tratativa dos chamados", Icon: Headset },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-5 py-6 sm:px-8">
      <div aria-hidden className="absolute -left-24 -top-32 h-64 w-64 rounded-full border-[32px] border-primary/30" />
      <div aria-hidden className="absolute -right-24 -bottom-36 h-72 w-72 rounded-full border-[28px] border-primary/25" />
      <div aria-hidden className="absolute left-0 top-24 h-px w-36 rotate-[-22deg] bg-primary/70" />
      <header className="relative z-10 mx-auto flex max-w-5xl justify-end"><ThemeToggle /></header>
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col justify-center py-12 sm:min-h-[calc(100vh-80px)] sm:py-16">
        <KitHubBrand />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {perfis.map(({ perfil, title, description, Icon }) => (
            <article key={perfil} className="flex min-h-80 flex-col items-center rounded-xl border border-primary/80 bg-card p-7 text-center shadow-xs sm:p-9">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/20 text-foreground"><Icon className="h-10 w-10" strokeWidth={2.2} /></span>
              <h2 className="mt-5 text-2xl font-extrabold">{title}</h2>
              <p className="mt-2 max-w-64 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <Button asChild className="mt-auto w-full max-w-52 rounded-full"><Link to="/auth" search={{ perfil }}>Acessar <ArrowRight /></Link></Button>
            </article>
          ))}
        </div>
        <div className="mt-9 flex items-center justify-center gap-4 text-center text-xs text-muted-foreground"><span className="h-px w-14 bg-primary" /><span>Escolha seu perfil para entrar com e-mail e senha</span><span className="h-px w-14 bg-primary" /></div>
      </main>
    </div>
  );
}