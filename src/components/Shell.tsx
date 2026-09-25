import { Link, useNavigate, useRouter, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { Status } from "@/lib/chamados";
import { getMyRole } from "@/lib/chamados";
import { supabase } from "@/integrations/supabase/client";

const linkCls = "text-muted-foreground hover:text-foreground";
const active = { className: "text-foreground font-semibold" };

export function Shell({ title, children, perfil = "lojinha" }: { title: string; children: ReactNode; perfil?: "lojinha" | "sac" | "admin" }) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });
  const qc = useQueryClient();
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const isAdmin = role === "admin";
  const inicio = perfil === "sac" ? "/sac" : "/lojinha";
  const naInicial = pathname === "/lojinha" || pathname === "/sac";
  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  function voltar() {
    if (window.history.length > 1) router.history.back();
    else navigate({ to: inicio });
  }
  const rotulo = perfil === "sac" ? "SAC" : perfil === "admin" ? "Administrador" : "Lojinha";
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <span className="font-bold tracking-tight">KitHub <span className="ml-2 text-xs font-normal text-muted-foreground">{rotulo}</span></span>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {perfil === "lojinha" && (
              <>
                <Link to="/lojinha" className={linkCls} activeOptions={{ exact: true }} activeProps={active}>Dashboard</Link>
                <Link to="/lojinha/chamados" className={linkCls} activeProps={active}>Chamados</Link>
                <Link to="/lojinha/novo" className={linkCls} activeProps={active}>Novo chamado</Link>
              </>
            )}
            {perfil === "sac" && (
              <>
                <Link to="/sac" className={linkCls} activeOptions={{ exact: true }} activeProps={active}>Dashboard</Link>
                <Link to="/sac/chamados" className={linkCls} activeProps={active}>Chamados</Link>
              </>
            )}
            {isAdmin && (
              <>
                {perfil !== "lojinha" && <Link to="/lojinha" className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">Ir para Lojinha</Link>}
                {perfil !== "sac" && <Link to="/sac" className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">Ir para SAC</Link>}
                <Link to="/admin" className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground" activeProps={active}>Usuários</Link>
              </>
            )}
            <button onClick={sair} className={linkCls}>Sair</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {!naInicial && (
          <button onClick={voltar} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        )}
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
