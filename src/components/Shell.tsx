import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Status } from "@/lib/chamados";

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-bold tracking-tight">Reenvio de Kits Pax</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/lojinha" className="text-muted-foreground hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-semibold" }}>Dashboard</Link>
            <Link to="/lojinha/chamados" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>Chamados</Link>
            <Link to="/lojinha/novo" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>Novo chamado</Link>
            <Link to="/" className="text-muted-foreground hover:text-foreground">Sair</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-block rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
      {status}
    </span>
  );
}
