import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Store, Headset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, estouAprovado, type Perfil } from "@/lib/chamados";

type PerfilLogin = "lojinha" | "sac";

const PERFIL_INFO: Record<PerfilLogin, { label: string; Icon: typeof Store }> = {
  lojinha: { label: "Lojinha", Icon: Store },
  sac: { label: "SAC", Icon: Headset },
};

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { perfil?: PerfilLogin } =>
    s["perfil"] === "lojinha" || s["perfil"] === "sac" ? { perfil: s["perfil"] } : {},
  head: () => ({
    meta: [
      { title: "Entrar — Reenvio de Kits Pax" },
      { name: "description", content: "Acesse o sistema de chamados de reenvio de kits com seu e-mail e senha." },
      { property: "og:title", content: "Entrar — Reenvio de Kits Pax" },
      { property: "og:description", content: "Acesse o sistema de chamados de reenvio de kits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const input = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const { perfil } = Route.useSearch();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function irParaPainel(role: Perfil | null) {
    if (role === "sac") navigate({ to: "/sac" });
    else if (role === "lojinha" || role === "admin") navigate({ to: "/lojinha" });
  }

  useEffect(() => {
    if (!perfil) navigate({ to: "/", replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) irParaPainel(await getMyRole());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!perfil) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const senha = String(f.get("senha") ?? "");
    setErro(""); setAviso(""); setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw new Error("E-mail ou senha inválidos.");
        if (!(await estouAprovado())) {
          await supabase.auth.signOut();
          throw new Error("Seu acesso ainda está aguardando aprovação do administrador.");
        }
        const role = await getMyRole();
        if (role !== perfil && role !== "admin") {
          await supabase.auth.signOut();
          throw new Error(`Este acesso não pertence ao perfil ${PERFIL_INFO[perfil].label}.`);
        }
        await irParaPainel(role);
      } else {
        const nome = String(f.get("nome") ?? "").trim();
        if (senha.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");
        const { data, error } = await supabase.auth.signUp({
          email, password: senha,
          options: { emailRedirectTo: `${window.location.origin}/auth?perfil=${perfil}`, data: { nome, perfil } },
        });
        if (error) throw error;
        if (data.session) await supabase.auth.signOut();
        setAviso("Cadastro feito! Confirme o link enviado ao seu e-mail e aguarde a aprovação do administrador para entrar.");
        setModo("entrar");
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setCarregando(false);
    }
  }

  if (!perfil) return null;
  const { label, Icon } = PERFIL_INFO[perfil];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reenvio de Kits Pax</h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium">
            <Icon className="h-4 w-4 text-primary" />
            {modo === "entrar" ? `Entrar como ${label}` : `Cadastrar ${label}`}
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border bg-background p-6">
          {modo === "cadastrar" && (
            <label className="block text-sm font-medium">Nome<input name="nome" required maxLength={100} className={input} /></label>
          )}
          <label className="block text-sm font-medium">E-mail<input name="email" type="email" required className={input} /></label>
          <label className="block text-sm font-medium">Senha<input name="senha" type="password" required minLength={6} className={input} /></label>
          {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
          {aviso && <p className="text-sm font-medium text-primary">{aviso}</p>}
          <button type="submit" disabled={carregando} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Cadastrar"}
          </button>
          <button type="button" onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setErro(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground">
            {modo === "entrar" ? "Não tem acesso? Cadastre-se" : "Já tem acesso? Entrar"}
          </button>
          <Link to="/" className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">Trocar perfil</Link>
        </form>
      </div>
    </div>
  );
}
