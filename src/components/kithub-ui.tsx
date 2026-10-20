import { Link } from "@tanstack/react-router";
import { Box, Moon, PackageOpen, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function KitHubBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="inline-flex min-w-0 items-center gap-3" aria-label="KitHub — início">
      <span className={cn("grid shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm", compact ? "h-10 w-10" : "h-12 w-12")}>
        <Box className={compact ? "h-5 w-5" : "h-7 w-7"} strokeWidth={2.4} />
      </span>
      <span className="min-w-0">
        <strong className={cn("block truncate font-extrabold text-foreground", compact ? "text-xl" : "text-3xl")}>KitHub</strong>
        <span className={cn("block text-muted-foreground", compact ? "text-xs" : "text-sm")}>Gestão de Controle</span>
      </span>
    </Link>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function alternar() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("kithub-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <Button variant="outline" size={compact ? "icon" : "sm"} onClick={alternar} className={cn("border-primary/60 bg-background", !compact && "rounded-full px-3")} aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"} title={dark ? "Modo claro" : "Modo escuro"}>
      {dark ? <Sun className="text-primary" /> : <Moon className="text-primary" />}
      {!compact && <span>{dark ? "Modo claro" : "Modo escuro"}</span>}
    </Button>
  );
}

export function PageIntro({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, to, search, featured = false, urgente = false, centralizado = false }: { label: string; value: number; icon: LucideIcon; to: "/lojinha/chamados" | "/sac/chamados" | "/lojinha/reversos" | "/sac/reversos"; search: Record<string, string>; featured?: boolean; urgente?: boolean; centralizado?: boolean }) {
  return (
    <Link to={to} search={search} className={cn("group min-h-36 rounded-xl border bg-card p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-sm", featured && "border-primary bg-primary/8", urgente && "border-destructive bg-destructive/10 hover:border-destructive motion-safe:animate-pulse", centralizado && "flex flex-col items-center text-center")}>
      <div className={cn("flex items-start justify-between gap-3", centralizado && "w-full flex-col items-center")}>
        <span className={cn("grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground", featured && "bg-primary text-primary-foreground", urgente && "bg-destructive text-destructive-foreground group-hover:bg-destructive group-hover:text-destructive-foreground")}><Icon className="h-5 w-5" /></span>
        <span className={cn("text-3xl font-extrabold text-foreground", urgente && "text-destructive")}>{value}</span>
      </div>
      <p className={cn("mt-5 text-sm font-semibold leading-snug text-foreground", urgente && "text-destructive")}>{label}</p>
      {urgente && <span className="mt-2 rounded-full bg-destructive px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-destructive-foreground">Atenção</span>}
    </Link>
  );
}

export function EmptyState({ message = "Nenhum chamado encontrado." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary"><PackageOpen className="h-6 w-6" /></span>
      <p className="mt-3 text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}