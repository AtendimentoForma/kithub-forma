import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, X } from "lucide-react";
import { Shell } from "./Shell";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { DESTINOS, getMyRole, minhasPermissoesQuery, podeEditar, mensagemDeErro } from "@/lib/chamados";
import { ORIGENS_REVERSO, MOTIVOS_REVERSO, reversoSchema, validarArquivoReverso, type AnexoReverso } from "@/lib/reversos-schema";
import { criarReverso } from "@/lib/reversos.functions";
import { supabase } from "@/integrations/supabase/client";

function Campo({ label, name }: { label: string; name: string }) {
  return <label className="block text-sm font-medium">{label} *<Input className="mt-1.5" name={name} required maxLength={255} /></label>;
}
export function ReversoForm({ perfil }: { perfil: "sac" | "lojinha" }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role = null } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const { data: permissoes } = useQuery(minhasPermissoesQuery);
  const [origens, setOrigens] = useState<string[]>([]);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [dados, setDados] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const path = perfil === "sac" ? "/sac/reversos" : "/lojinha/reversos";
  const toggle = (v: string, lista: string[], set: (v: string[]) => void) => set(lista.includes(v) ? lista.filter(x => x !== v) : [...lista, v]);
  function adicionar(lista: FileList | null) {
    if (!lista) return;
    try {
      const novos = Array.from(lista);
      novos.forEach(validarArquivoReverso);
      if (files.length + novos.length > 20) throw new Error("Anexe até 20 arquivos.");
      setFiles(p => [...p, ...novos]); setErro("");
    } catch (e) { setErro(mensagemDeErro(e, "Confira os arquivos.")); }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const payload = { perfil, origens, paxNome: g("paxNome"), cpf: g("cpf"), paxId: g("paxId"), idDelivery: g("idDelivery"), responsavel: g("responsavel"), destino: g("destino"), ano: g("ano"), dadosReverso: dados, autorizacaoMandae: g("autorizacaoMandae"), rastreamentoMandae: g("rastreamentoMandae"), motivos, observacao: g("observacao") };
    const checked = reversoSchema.safeParse({ ...payload, anexos: files.map((file, i) => ({ nome: file.name, caminho: `pendente/${i}`, tipo: file.type, tamanho: file.size })) });
    if (!checked.success) return setErro(checked.error.issues[0]?.message ?? "Confira os campos.");
    setErro(""); setEnviando(true);
    const enviados: AnexoReverso[] = [];
    let salvo = false;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sessão expirada. Entre novamente.");
      for (const file of files) {
        validarArquivoReverso(file);
        const caminho = `${user.id}/${crypto.randomUUID()}`;
        const { error } = await supabase.storage.from("reversos-anexos").upload(caminho, file, { contentType: file.type });
        if (error) throw error;
        enviados.push({ nome: file.name, caminho, tipo: file.type, tamanho: file.size });
      }
      const registro = await criarReverso({ data: { ...checked.data, anexos: enviados } });
      salvo = true;
      await qc.invalidateQueries({ queryKey: ["reversos"] });
      await navigate({ to: path, search: { numero: registro.numero } });
    } catch (error) {
      if (!salvo && enviados.length) await supabase.storage.from("reversos-anexos").remove(enviados.map(a => a.caminho));
      setErro(mensagemDeErro(error, "Não foi possível registrar o reverso."));
    } finally { setEnviando(false); }
  }
  if (!podeEditar(role, permissoes, "chamados") && !podeEditar(role, permissoes, "reenvios")) return <Shell title="Novo reverso" perfil={perfil}><p className="text-muted-foreground">Seu acesso é somente de consulta.</p></Shell>;
  return <Shell title="Novo reverso" perfil={perfil}>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={enviando} className="space-y-6">
        <section className="kithub-surface p-5 sm:p-6"><h2 className="mb-4 font-semibold">Origem da solicitação *</h2><div className="flex flex-wrap gap-4">{ORIGENS_REVERSO.map(o => <label key={o} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={origens.includes(o)} onChange={() => toggle(o, origens, setOrigens)} />{o}</label>)}</div></section>
        <section className="kithub-surface p-5 sm:p-6"><h2 className="mb-4 font-semibold">Dados do passageiro</h2><div className="grid gap-4 sm:grid-cols-2"><Campo label="Nome" name="paxNome" /><Campo label="CPF" name="cpf" /><Campo label="ID do Pax" name="paxId" /><Campo label="ID Delivery" name="idDelivery" /><Campo label="Nome do responsável" name="responsavel" /></div></section>
        <section className="kithub-surface p-5 sm:p-6"><h2 className="mb-4 font-semibold">Viagem</h2><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Destino *<select name="destino" required defaultValue="" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="" disabled>Selecione o destino</option>{DESTINOS.map(d => <option key={d}>{d}</option>)}</select></label><Campo label="Ano" name="ano" /></div></section>
        <section className="kithub-surface p-5 sm:p-6"><h2 className="mb-4 font-semibold">Informações do reverso *</h2><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={dados} onChange={e => setDados(e.target.checked)} />Dados do reverso</label>{dados && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Campo label="Autorização Mandaê" name="autorizacaoMandae" /><Campo label="Rastreamento Mandaê" name="rastreamentoMandae" /></div>}</section>
        <section className="kithub-surface p-5 sm:p-6"><h2 className="mb-4 font-semibold">Motivo da solicitação *</h2><div className="flex flex-wrap gap-4">{MOTIVOS_REVERSO.map(m => <label key={m} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={motivos.includes(m)} onChange={() => toggle(m, motivos, setMotivos)} />{m}</label>)}</div></section>
        <section className="kithub-surface p-5 sm:p-6"><h2 className="mb-4 font-semibold">Informações adicionais</h2><label className="block text-sm font-medium">Observação / descrição<Textarea name="observacao" className="mt-1.5" rows={4} maxLength={1000} /></label><div className="mt-4"><span className="block text-sm font-medium">Anexar fotos / documentos{motivos.includes("Defeito") && " *"}</span><label htmlFor="reverso-anexos" className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed bg-muted/40 px-4 py-2.5 text-sm"><Paperclip className="h-4 w-4 text-primary" />{files.length ? "Adicionar mais arquivos" : "Escolher arquivos"}</label><input id="reverso-anexos" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.pdf" multiple className="hidden" onChange={e => { adicionar(e.target.files); e.target.value = ""; }} /><ul className="mt-3 space-y-2">{files.map((file, i) => <li key={`${file.name}-${i}`} className="flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"><span className="truncate">{file.name}</span><Button type="button" variant="ghost" size="icon" aria-label={`Remover ${file.name}`} onClick={() => setFiles(p => p.filter((_, n) => n !== i))}><X /></Button></li>)}</ul></div></section>
      </fieldset>
      {erro && <p role="alert" className="text-sm font-medium text-destructive">{erro}</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Registrar reverso"}</Button><Button asChild variant="outline"><Link to={path} search={{ numero: undefined }}>Cancelar</Link></Button></div>
    </form>
  </Shell>;
}
