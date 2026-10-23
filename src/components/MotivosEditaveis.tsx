import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MOTIVOS, mensagemDeErro } from "@/lib/chamados";
import { MOTIVOS_REVERSO } from "@/lib/reversos-schema";

export function MotivosEditaveis({ tipo, motivos, detalhes, permitido, salvar }: { tipo: "chamado" | "reverso"; motivos: string[]; detalhes: Record<string, string>; permitido: boolean; salvar: (patch: Record<string, unknown>) => Promise<void> }) {
  const [editando, setEditando] = useState(false);
  const [selecionados, setSelecionados] = useState(motivos);
  const [textos, setTextos] = useState(detalhes);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const condicionais = tipo === "chamado" ? [["Outro", "motivo_outro", "Descreva o motivo Outro"], ["Envio correios", "motivo_correios", "Descreva o motivo do envio por correios"]] : [["Kit de outro destino", "kit_outro_destino", "Descreva qual kit de qual destino foi recebido"], ["Objeto danificado", "objeto_danificado", "Descreva o que aconteceu com o objeto danificado"]];
  return <div className="min-w-0 sm:col-span-2"><dt className="flex items-center justify-between text-xs text-muted-foreground">Motivo da solicitação{permitido && !editando && <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar motivos" aria-label="Editar motivos" onClick={() => { setSelecionados(motivos); setTextos(detalhes); setErro(""); setEditando(true); }}><Pencil className="h-3.5 w-3.5" /></Button>}</dt><dd className="mt-1 font-medium">{!editando ? motivos.join(", ") : <div className="space-y-3"><div className="flex flex-wrap gap-3">{(tipo === "chamado" ? MOTIVOS : MOTIVOS_REVERSO).map(m => <label key={m} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={ocupado} checked={selecionados.includes(m)} onChange={e => setSelecionados(p => e.target.checked ? [...p, m] : p.filter(x => x !== m))} />{m}</label>)}</div>{condicionais.map(([m, campo, label]) => selecionados.includes(m ?? "") && campo && <label key={campo} className="block text-sm">{label} *<Textarea required disabled={ocupado} maxLength={1000} value={textos[campo] ?? ""} onChange={e => setTextos(p => ({ ...p, [campo]: e.target.value }))} /></label>)}<div className="flex gap-2"><Button size="sm" disabled={ocupado} onClick={async () => { setOcupado(true); setErro(""); try { await salvar({ motivos: selecionados, ...Object.fromEntries(condicionais.filter(([m]) => selecionados.includes(m ?? "")).map(([, campo]) => [campo, campo ? textos[campo] ?? "" : ""])) }); setEditando(false); } catch (e) { setErro(mensagemDeErro(e, "Confira os motivos.")); } finally { setOcupado(false); } }}><Check />Salvar</Button><Button size="sm" variant="outline" disabled={ocupado} onClick={() => setEditando(false)}><X />Cancelar</Button></div>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}</div>}</dd></div>;
}