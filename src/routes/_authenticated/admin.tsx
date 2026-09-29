import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { definirUsuario, getMyRole, listarUsuarios, PERMISSOES, type Perfil, type Permissao, type UsuarioAdmin } from "@/lib/chamados";

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
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
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

  function alternar(p: Permissao) {
    setPermissoes((atual) => (atual.includes(p) ? atual.filter((x) => x !== p) : [...atual, p]));
  }

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
        <div className="mt-2">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Funções (segure Ctrl/Cmd para marcar mais de uma)</p>
          <select
            multiple
            size={PERMISSOES.length}
            value={permissoes}
            onChange={(e) => setPermissoes(Array.from(e.target.selectedOptions, (o) => o.value as Permissao))}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
          >
            {PERMISSOES.map((p) => (
              <option key={p.v} value={p.v} title={p.d}>{p.l} — {p.d}</option>
            ))}
          </select>
        </div>
        {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-2">
          {u.aprovado ? (
            <>
              <button disabled={salvando} onClick={() => salvar(true)} className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-60">Salvar</button>
              <button disabled={salvando} onClick={() => salvar(false)} className="rounded-md border px-3 py-1 text-xs text-destructive hover:bg-muted disabled:opacity-60">Bloquear</button>
            </>
          ) : (
            <button disabled={salvando} onClick={() => salvar(true)} className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">Aprovar</button>
          )}
        </div>
      </td>
    </tr>
  );
}
