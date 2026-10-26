import { useState, type ReactNode } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { mensagemDeErro } from "@/lib/chamados";

export type CampoEditorProps = { label: string; valor: string; permitido: boolean; salvar: (valor: string) => Promise<void>; opcoes?: readonly string[] | undefined; multiplo?: boolean; longo?: boolean; data?: boolean; children?: ReactNode };
export function CampoEditavel({ label, valor, permitido, salvar, opcoes, multiplo, longo, data, children }: CampoEditorProps) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(valor);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  async function confirmar() {
    setSalvando(true); setErro("");
    try { await salvar(rascunho); setEditando(false); }
    catch (e) { setErro(mensagemDeErro(e, "Não foi possível salvar.")); }
    finally { setSalvando(false); }
  }
  return <div className="min-w-0"><dt className="flex items-center justify-between gap-2 text-xs text-muted-foreground">{label}{permitido && !editando && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" title={`Editar ${label}`} aria-label={`Editar ${label}`} onClick={() => { setRascunho(valor); setErro(""); setEditando(true); }}><Pencil className="h-3.5 w-3.5" /></Button>}</dt><dd className="mt-1 break-words whitespace-pre-wrap font-medium">{editando ? <div className="space-y-2">
    {opcoes && multiplo ? <div className="flex flex-wrap gap-3">{opcoes.map(o => <label key={o} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={salvando} checked={rascunho.split(", ").includes(o)} onChange={e => { const valores = rascunho ? rascunho.split(", ") : []; setRascunho((e.target.checked ? [...valores, o] : valores.filter(v => v !== o)).join(", ")); }} />{o}</label>)}</div>
      : opcoes ? <select aria-label={label} value={rascunho} disabled={salvando} onChange={e => setRascunho(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Selecione</option>{opcoes.map(o => <option key={o}>{o}</option>)}</select>
      : longo ? <Textarea aria-label={label} value={rascunho} disabled={salvando} rows={3} maxLength={1000} onChange={e => setRascunho(e.target.value)} />
      : <Input aria-label={label} type={data ? "date" : "text"} value={rascunho} disabled={salvando} maxLength={255} onChange={e => setRascunho(e.target.value)} />}
    <div className="flex gap-2"><Button type="button" size="sm" disabled={salvando} onClick={() => void confirmar()}><Check />{salvando ? "Salvando..." : "Salvar"}</Button><Button type="button" size="sm" variant="outline" disabled={salvando} onClick={() => setEditando(false)}><X />Cancelar</Button></div>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
  </div> : children ?? (valor || "—")}</dd></div>;
}