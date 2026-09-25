import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Status } from "@/lib/chamados";
import { supabase } from "@/integrations/supabase/client";

const linkCls = "text-muted-foreground hover:text-foreground";
const active = { className: "text-foreground font-semibold" };

export function Shell({ title, children, perfil = "lojinha" }: { title: string; children: ReactNode; perfil?: "lojinha" | "sac" }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const isAdmin = role === "admin";
  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-bold tracking-tight">Reenvio de Kits Pax <span className="ml-2 text-xs font-normal text-muted-foreground">{perfil === "sac" ? "SAC" : "Lojinha"}</span></span>
          <nav className="flex gap-4 text-sm">
            {perfil === "lojinha" ? (
              <>
                <Link to="/lojinha" className={linkCls} activeOptions={{ exact: true }} activeProps={active}>Dashboard</Link>
                <Link to="/lojinha/chamados" className={linkCls} activeProps={active}>Chamados</Link>
                <Link to="/lojinha/novo" className={linkCls} activeProps={active}>Novo chamado</Link>
              </>
            ) : (
              <Link to="/sac" className={linkCls} activeProps={active}>Chamados</Link>
            )}
            <button onClick={sair} className={linkCls}>Sair</button>
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
