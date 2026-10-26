import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KitHubBrand, ThemeToggle } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Redefinir senha — KitHub" },
    { name: "description", content: "Cadastre uma nova senha para acessar o KitHub." },
    { property: "og:title", content: "Redefinir senha — KitHub" },
    { property: "og:description", content: "Recuperação segura de acesso ao KitHub." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pronto, setPronto] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [mostrar, setMostrar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  useEffect(() => {
    let ativo = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const recovery = hash.get("type") === "recovery";
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (ativo && event === "PASSWORD_RECOVERY") { setPronto(true); setVerificando(false); }
    });
    if (hash.has("error") || hash.has("error_description")) {
      setErro("Este link expirou ou é inválido. Solicite um novo link na tela de entrada.");
      setVerificando(false);
    } else {
      // The client may already have consumed the recovery hash before this page mounts.
      supabase.auth.getUser().then(({ data: usuario, error }) => {
        if (!ativo) return;
        setPronto(!error && !!usuario.user);
        setVerificando(false);
        if (error || !usuario.user) setErro(recovery ? "Não foi possível validar o link. Solicite um novo link." : "Abra o link enviado ao seu e-mail para redefinir a senha.");
      });
    }
    return () => { ativo = false; data.subscription.unsubscribe(); };
  }, []);
  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!pronto) return;
    const f = new FormData(e.currentTarget);
    const password = String(f.get("senha") ?? "");
    if (password !== f.get("confirmacao")) { setErro("As senhas não coincidem."); return; }
    setOcupado(true); setErro("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSucesso(true);
      await supabase.auth.signOut();
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível atualizar a senha."); }
    finally { setOcupado(false); }
  }
  return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
    <div className="absolute right-5 top-5"><ThemeToggle /></div>
    <div className="w-full max-w-md"><div className="mb-7 flex justify-center"><KitHubBrand /></div>
      <div className="rounded-xl border border-primary/55 bg-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-5 flex items-center gap-2 text-xl font-semibold"><KeyRound className="text-primary" />Redefinir senha</h1>
        {verificando ? <p className="text-sm text-muted-foreground">Validando link...</p> : sucesso ? <p role="status" className="text-sm">Senha atualizada! Entre novamente com sua nova senha.</p> : pronto && <form onSubmit={salvar} className="space-y-4">
          <label className="block text-sm font-medium">Nova senha<span className="relative mt-1.5 block"><Input name="senha" type={mostrar ? "text" : "password"} required minLength={6} autoComplete="new-password" className="pr-11" /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"} onClick={() => setMostrar(v => !v)}>{mostrar ? <EyeOff /> : <Eye />}</Button></span></label>
          <label className="block text-sm font-medium">Confirmar nova senha<Input className="mt-1.5" name="confirmacao" type={mostrar ? "text" : "password"} required minLength={6} autoComplete="new-password" /></label>
          <Button type="submit" disabled={ocupado} className="w-full">{ocupado ? "Salvando..." : "Salvar nova senha"}</Button>
        </form>}
        {erro && <p role="alert" className="mt-4 text-sm text-destructive">{erro}</p>}
        <Button asChild variant="outline" className="mt-5 w-full"><Link to="/">Voltar para entrar</Link></Button>
      </div>
    </div>
  </div>;
}