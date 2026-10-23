import { useState } from "react";
import { Pencil, X, Check, Paperclip } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { validarArquivoReverso, type AnexoReverso } from "@/lib/reversos-schema";
import { mensagemDeErro } from "@/lib/chamados";

export function AnexosEditaveis({ tipo, anexos, permitido, salvar }: { tipo: "chamado" | "reverso"; anexos: AnexoReverso[]; permitido: boolean; salvar: (anexos: AnexoReverso[]) => Promise<void> }) {
  const [editando, setEditando] = useState(false);
  const [mantidos, setMantidos] = useState(anexos);
  const [files, setFiles] = useState<File[]>([]);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function confirmar() {
    setOcupado(true); setErro(""); const novos: AnexoReverso[] = []; let salvo = false;
    const bucket = tipo === "chamado" ? "chamados-anexos" : "reversos-anexos";
    try {
      if (mantidos.length + files.length > 20) throw new Error("Anexe até 20 arquivos.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");
      for (const f of files) { validarArquivoReverso(f); const caminho = `${user.id}/${crypto.randomUUID()}`; const { error } = await supabase.storage.from(bucket).upload(caminho, f, { contentType: f.type }); if (error) throw error; novos.push({ nome: f.name, tipo: f.type, tamanho: f.size, caminho }); }
      await salvar([...mantidos, ...novos]); salvo = true; setEditando(false);
    } catch (e) { if (!salvo && novos.length) await supabase.storage.from(bucket).remove(novos.map(a => a.caminho)); setErro(mensagemDeErro(e, "Não foi possível salvar os anexos.")); }
    finally { setOcupado(false); }
  }
  if (!permitido) return null;
  return <div className="mt-2">{!editando ? <Button variant="ghost" size="sm" aria-label="Editar anexos" title="Editar anexos" onClick={() => { setMantidos(anexos); setFiles([]); setErro(""); setEditando(true); }}><Pencil />Editar anexos</Button> : <div className="space-y-2">{mantidos.map(a => <div key={a.caminho} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{a.nome}</span><Button size="icon" variant="ghost" disabled={ocupado} aria-label={`Remover ${a.nome}`} onClick={() => setMantidos(p => p.filter(x => x.caminho !== a.caminho))}><X /></Button></div>)}<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"><Paperclip />Adicionar arquivos<input type="file" multiple disabled={ocupado} className="hidden" accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg,.pdf" onChange={e => { try { const lista = Array.from(e.target.files ?? []); lista.forEach(validarArquivoReverso); setFiles(p => [...p, ...lista]); setErro(""); } catch (error) { setErro(mensagemDeErro(error, "Confira os arquivos.")); } e.target.value = ""; }} /></label>{files.map((f, i) => <div key={`${f.name}-${i}`} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{f.name}</span><Button size="icon" variant="ghost" disabled={ocupado} aria-label={`Remover ${f.name}`} onClick={() => setFiles(p => p.filter((_, n) => n !== i))}><X /></Button></div>)}<div className="flex gap-2"><Button size="sm" disabled={ocupado} onClick={() => void confirmar()}><Check />Salvar</Button><Button size="sm" variant="outline" disabled={ocupado} onClick={() => setEditando(false)}><X />Cancelar</Button></div>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}</div>}</div>;
}