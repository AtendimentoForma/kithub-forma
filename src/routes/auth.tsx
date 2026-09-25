import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Store, Headset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, type Perfil } from "@/lib/chamados";

export const Route = createFileRoute("/auth")({
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
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [perfil, setPerfil] = useState<Perfil>("lojinha");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function irParaPainel() {
    const role = await getMyRole();
    if (role === "sac") navigate({ to: "/sac" });
    else if (role === "lojinha") navigate({ to: "/lojinha" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) irParaPainel(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const senha = String(f.get("senha") ?? "");
    setErro(""); setAviso(""); setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw new Error("E-mail ou senha inválidos.");
        await irParaPainel();
      } else {
        const nome = String(f.get("nome") ?? "").trim();
        if (senha.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");
        const { data, error } = await supabase.auth.signUp({
          email, password: senha,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { nome, perfil } },
        });
        if (error) throw error;
        if (data.session) await irParaPainel();
        else { setAviso("Cadastro feito! Confirme pelo link enviado ao seu e-mail e depois entre."); setModo("entrar"); }
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reenvio de Kits Pax</h1>
          <p className="mt-2 text-muted-foreground">{modo === "entrar" ? "Entre com seu e-mail e senha" : "Crie seu acesso"}</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-background p-6">
          {modo === "cadastrar" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {([["lojinha", "Lojinha", Store], ["sac", "SAC", Headset]] as const).map(([v, l, Icon]) => (
                  <button type="button" key={v} onClick={() => setPerfil(v)}
                    className={`rounded-lg border p-3 text-sm font-medium ${perfil === v ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                    <Icon className="mx-auto mb-1 h-6 w-6 text-primary" />{l}
                  </button>
                ))}
              </div>
              <label className="block text-sm font-medium">Nome<input name="nome" required maxLength={100} className={input} /></label>
            </>
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
        </form>
      </div>
    </div>
  );
}
