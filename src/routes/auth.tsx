import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Store, Headset, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, estouAprovado, type Perfil } from "@/lib/chamados";
import { KitHubBrand, ThemeToggle } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";

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
      { title: "Entrar — KitHub" },
      { name: "description", content: "Acesse o sistema de chamados de reenvio de kits com seu e-mail e senha." },
      { property: "og:title", content: "Entrar — KitHub" },
      { property: "og:description", content: "Acesse o sistema de chamados de reenvio de kits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const input = "mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-hidden focus:border-primary focus:ring-3 focus:ring-primary/15";

function AuthPage() {
  const navigate = useNavigate();
  const { perfil } = Route.useSearch();
  const [modo, setModo] = useState<"entrar" | "cadastrar" | "recuperar">("entrar");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setAviso("Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também o spam.");
      } else if (modo === "entrar") {
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
        const { error } = await supabase.auth.signUp({
          email, password: senha,
          options: { emailRedirectTo: `${window.location.origin}/auth?perfil=${perfil}`, data: { nome, perfil } },
        });
        if (error) throw error;
        await supabase.auth.signOut();
        setAviso("Cadastro feito! Aguarde a aprovação do administrador para entrar.");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div aria-hidden className="absolute -left-28 -top-36 h-72 w-72 rounded-full border-[30px] border-primary/25" />
      <div className="absolute right-5 top-5"><ThemeToggle /></div>
      <div className="relative w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center"><KitHubBrand /></div>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-primary/60 bg-card px-4 py-2 text-sm font-semibold">
            <Icon className="h-4 w-4 text-primary" />
            {modo === "recuperar" ? "Recuperar senha" : modo === "entrar" ? `Entrar como ${label}` : `Cadastrar ${label}`}
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-primary/55 bg-card p-6 shadow-sm sm:p-8">
          {modo === "cadastrar" && (
            <label className="block text-sm font-medium">Nome<input name="nome" required maxLength={100} className={input} /></label>
          )}
          <label className="block text-sm font-medium">E-mail<input name="email" type="email" required className={input} /></label>
          {modo !== "recuperar" && <label className="block text-sm font-medium">
            Senha
            <span className="relative mt-1 block">
              <input
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                required
                minLength={6}
                className={`${input} mt-0 pr-11`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMostrarSenha((visivel) => !visivel)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 h-11 w-11 text-muted-foreground hover:text-foreground"
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </span>
          </label>}
          {modo === "entrar" && <Button variant="ghost" type="button" className="ml-auto flex text-sm text-muted-foreground" onClick={() => { setModo("recuperar"); setErro(""); setAviso(""); }}><KeyRound className="h-4 w-4" />Esqueci minha senha</Button>}
          {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
          {aviso && <p className="text-sm font-medium text-primary">{aviso}</p>}
          <Button type="submit" disabled={carregando} className="h-11 w-full rounded-full">
            {carregando ? "Aguarde..." : modo === "recuperar" ? "Enviar link de recuperação" : modo === "entrar" ? "Entrar" : "Cadastrar"}
          </Button>
          <Button variant="ghost" type="button" onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setErro(""); setAviso(""); }} className="w-full text-muted-foreground">
            {modo === "recuperar" ? "Voltar para entrar" : modo === "entrar" ? "Não tem acesso? Cadastre-se" : "Já tem acesso? Entrar"}
          </Button>
          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Trocar perfil</Link>
        </form>
      </div>
    </div>
  );
}
