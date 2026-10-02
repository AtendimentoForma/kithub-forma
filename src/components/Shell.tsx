import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, ChevronDown, Headphones, Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, Store, Users, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Status } from "@/lib/chamados";
import { getMyRole } from "@/lib/chamados";
import { supabase } from "@/integrations/supabase/client";
import { AlertaPrioridade } from "@/components/AlertaPrioridade";
import { KitHubBrand, PageIntro, ThemeToggle } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusTone: Partial<Record<Status, string>> = {
  "NOVO CHAMADO": "border-primary/40 bg-primary/15 text-foreground",
  "EM ANÁLISE": "border-chart-3/30 bg-chart-3/10 text-chart-3",
  "AGUARDANDO CLIENTE": "border-urgency-medium/30 bg-urgency-medium/10 text-urgency-medium",
  "AGUARDANDO PAGAMENTO": "border-chart-2/30 bg-chart-2/10 text-chart-2",
  "REENVIO AUTORIZADO": "border-urgency-low/30 bg-urgency-low/10 text-urgency-low",
  "ANÁLISE LIDERANÇA": "border-chart-4/30 bg-chart-4/10 text-chart-4",
  "PRIORIDADE DE ENTREGA": "border-destructive/30 bg-destructive/10 text-destructive",
  "PRIORIDADE FINALIZADA": "border-primary/50 bg-primary/15 text-foreground",
  "CONCLUÍDO": "border-border bg-muted text-muted-foreground",
};

export function Shell({ title, children, perfil = "lojinha" }: { title: string; children: ReactNode; perfil?: "lojinha" | "sac" | "admin" }) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });
  const qc = useQueryClient();
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [nome, setNome] = useState("Usuário");
  const isAdmin = role === "admin";
  const inicio = perfil === "sac" ? "/sac" : "/lojinha";
  const naInicial = pathname === "/lojinha" || pathname === "/sac" || pathname === "/admin";
  const rotulo = perfil === "sac" ? "SAC" : perfil === "admin" ? "Administrador" : "Lojinha";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setNome(String(data.user?.user_metadata?.["nome"] ?? data.user?.email?.split("@")[0] ?? "Usuário")));
  }, []);

  async function sair() {
    await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/", replace: true });
  }
  function voltar() { if (window.history.length > 1) router.history.back(); else navigate({ to: inicio }); }

  const links = [
    { label: "Início", to: inicio, icon: Home, show: true },
    { label: "Lojinha", to: "/lojinha" as const, icon: Store, show: perfil === "lojinha" || isAdmin },
    { label: "SAC", to: "/sac" as const, icon: Headphones, show: perfil === "sac" || isAdmin },
    { label: "Usuários", to: "/admin" as const, icon: Users, show: isAdmin },
  ].filter((item) => item.show);

  const SidebarContent = () => (
    <>
      <div className="flex h-20 items-center border-b border-sidebar-border px-4">
        <div className={cn(collapsed && "md:hidden")}><KitHubBrand compact /></div>
        <span className={cn("hidden h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground", collapsed && "md:grid")}>K</span>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
        {links.map(({ label, to, icon: Icon }) => {
          const selected = pathname === to || (to !== inicio && pathname.startsWith(`${to}/`));
          return <Link key={`${label}-${to}`} to={to} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined} className={cn("flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent", selected && "bg-sidebar-primary text-sidebar-primary-foreground", collapsed && "md:justify-center md:px-0")}><Icon className="h-5 w-5 shrink-0" /><span className={cn(collapsed && "md:hidden")}>{label}</span></Link>;
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Button variant="ghost" onClick={sair} className={cn("w-full justify-start text-muted-foreground", collapsed && "md:justify-center md:px-0")} title="Sair"><LogOut /><span className={cn(collapsed && "md:hidden")}>Sair</span></Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <AlertaPrioridade />
      {mobileOpen && <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0", mobileOpen && "translate-x-0", collapsed && "md:w-18")}>
        <Button variant="ghost" size="icon" className="absolute right-3 top-3 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X /></Button>
        <SidebarContent />
      </aside>
      <div className={cn("min-h-screen transition-[padding] md:pl-64", collapsed && "md:pl-18")}>
        <header className="sticky top-0 z-30 h-18 border-b bg-background/95 backdrop-blur">
          <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu /></Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
            <div className="min-w-0" />
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle compact />
              <Button variant="ghost" size="icon" aria-label="Notificações" title="Notificações"><Bell /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-11 gap-2 px-1.5 sm:px-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{nome.slice(0, 2).toUpperCase()}</span><span className="hidden min-w-0 text-left sm:block"><span className="block max-w-32 truncate text-xs font-semibold">{nome}</span><span className="block text-[11px] font-normal text-muted-foreground">{rotulo}</span></span><ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52"><DropdownMenuLabel>{nome}<span className="block text-xs font-normal text-muted-foreground">{rotulo}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void sair()}><LogOut /> Sair</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">
          {!naInicial && <Button variant="ghost" onClick={voltar} className="mb-4 -ml-2 text-muted-foreground"><ArrowLeft /> Voltar</Button>}
          <PageIntro title={title} />
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusTone[status])}>{status}</span>;
}