import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { definirUsuario, getMyRole, listarUsuarios, PERMISSOES, type Perfil, type Permissao, type UsuarioAdmin } from "@/lib/chamados";
import { Button } from "@/components/ui/button";
import { ChevronDown, KeyRound, Eye, EyeOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { alterarSenhaDoUsuario } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const role = await getMyRole();
    if (role !== "admin") throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Usuários e papéis — KitHub" },
      { name: "description", content: "Aprovação de usuários e definição de papéis pelo administrador." },
      { property: "og:title", content: "Usuários e papéis" },
      { property: "og:description", content: "Aprovação de usuários e definição de papéis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const PAPEIS: { v: Perfil; l: string }[] = [
  { v: "lojinha", l: "Lojinha" },
  { v: "sac", l: "SAC" },
  { v: "admin", l: "Administrador" },
];

function papelPrincipal(u: UsuarioAdmin): Perfil {
  if (u.papeis?.includes("admin")) return "admin";
  if (u.papeis?.includes("sac")) return "sac";
  return "lojinha";
}

function AdminPage() {
  const { data: lista = [], isLoading, error } = useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios });
  const pendentes = lista.filter((u) => !u.aprovado).length;
  return (
    <Shell title="Usuários e papéis" perfil="admin">
      <p className="mb-4 text-sm text-muted-foreground">
        {pendentes > 0 ? `${pendentes} usuário(s) aguardando aprovação.` : "Nenhum usuário aguardando aprovação."}
      </p>
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
            <tr><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Situação</th><th className="p-3">Papel</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-3" colSpan={5}>Carregando...</td></tr>}
            {lista.map((u) => <Linha key={u.id} u={u} />)}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function Linha({ u }: { u: UsuarioAdmin }) {
  const qc = useQueryClient();
  const [papel, setPapel] = useState<Perfil>(papelPrincipal(u));
  const [permissoes, setPermissoes] = useState<Permissao[]>(() => (u.permissoes ?? []).filter((p): p is Permissao => PERMISSOES.some((x) => x.v === p)));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");


  async function salvar(aprovado: boolean) {
    setSalvando(true); setErro("");
    try {
      await definirUsuario(u.id, aprovado, papel, permissoes);
      await qc.invalidateQueries({ queryKey: ["usuarios"] });
      await qc.invalidateQueries({ queryKey: ["minhas-permissoes"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally { setSalvando(false); }
  }
  return (
    <tr className="border-b last:border-0 align-top">
      <td className="p-3 font-medium">{u.nome || "—"}</td>
      <td className="p-3">{u.email}</td>
      <td className="p-3">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${u.aprovado ? "bg-secondary text-secondary-foreground" : "text-destructive"}`}>
          {u.aprovado ? "Aprovado" : "Aguardando"}
        </span>
      </td>
      <td className="p-3">
        <select value={papel} onChange={(e) => setPapel(e.target.value as Perfil)} className="rounded-md border border-input bg-background px-2 py-1">
          {PAPEIS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
        <div className="mt-2 w-56">
          <SelecaoFuncoes selecionadas={permissoes} aoAlterar={setPermissoes} />
        </div>
        {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-2">
          {u.aprovado ? (
            <>
              <Button size="sm" variant="outline" disabled={salvando} onClick={() => salvar(true)}>Salvar</Button>
              <Button size="sm" variant="outline" disabled={salvando} onClick={() => salvar(false)} className="text-destructive">Bloquear</Button>
            </>
          ) : (
            <Button size="sm" disabled={salvando} onClick={() => salvar(true)}>Aprovar</Button>
          )}
          <AlterarSenha u={u} />
        </div>
      </td>
    </tr>
  );
}

function AlterarSenha({ u }: { u: UsuarioAdmin }) {
  const alterar = useServerFn(alterarSenhaDoUsuario);
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState("");

  function fechar(v: boolean) {
    setAberto(v);
    if (!v) { setSenha(""); setConfirma(""); setErro(""); setVer(false); setOk(""); }
  }

  async function salvar() {
    setErro("");
    if (senha.length < 6) return setErro("A senha deve ter ao menos 6 caracteres.");
    if (senha !== confirma) return setErro("As senhas não conferem.");
    setSalvando(true);
    try {
      await alterar({ data: { userId: u.id, senha } });
      setOk("Senha alterada com sucesso. Informe a nova senha ao usuário."); setSenha(""); setConfirma("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao alterar a senha.");
    } finally { setSalvando(false); }
  }

  const campo = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-hidden focus:border-primary focus:ring-3 focus:ring-primary/15";
  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><KeyRound className="h-3.5 w-3.5" /> Alterar senha</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Defina uma nova senha para {u.nome || u.email}. Informe a nova senha ao usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block text-sm font-medium">Nova senha
            <div className="relative mt-1.5">
              <input type={ver ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} autoComplete="new-password" />
              <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <label className="block text-sm font-medium">Confirmar nova senha
            <input type={ver ? "text" : "password"} value={confirma} onChange={(e) => setConfirma(e.target.value)} className={`mt-1.5 ${campo}`} autoComplete="new-password" />
          </label>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          {ok && <p className="text-sm font-medium text-primary">{ok}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => fechar(false)}>Cancelar</Button>
          <Button disabled={salvando} onClick={salvar}>{salvando ? "Salvando..." : "Salvar senha"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelecaoFuncoes({ selecionadas, aoAlterar }: { selecionadas: Permissao[]; aoAlterar: (p: Permissao[]) => void }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  function alternar(v: Permissao) {
    aoAlterar(selecionadas.includes(v) ? selecionadas.filter((p) => p !== v) : [...selecionadas, v]);
  }

  function abrir() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - 272)) });
    setAberto((a) => !a);
  }

  const rotulo = selecionadas.length === 0 ? "Funções" : PERMISSOES.filter((p) => selecionadas.includes(p.v)).map((p) => p.l).join(", ");

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={abrir}
        className="w-full justify-between px-2 text-left text-xs"
      >
        <span className="truncate">{rotulo}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {aberto && pos && (
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 w-64 rounded-md border bg-background p-2 shadow-lg"
        >
          {PERMISSOES.map((p) => (
            <label key={p.v} className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs hover:bg-muted">
              <input
                type="checkbox"
                checked={selecionadas.includes(p.v)}
                onChange={() => alternar(p.v)}
                className="mt-0.5"
              />
              <span><span className="font-semibold">{p.l}</span> — {p.d}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

