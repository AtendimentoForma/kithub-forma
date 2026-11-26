import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { enviarEmailChamadoZendesk } from "@/lib/zendesk.functions";

type Enviado = { em: string; por: string; texto: string };

export function EnviarEmailZendesk({ numero, podeEnviar, inicial }: { numero: number; podeEnviar: boolean; inicial: Enviado | null }) {
  const qc = useQueryClient();
  const enviarFn = useServerFn(enviarEmailChamadoZendesk);
  const [enviado, setEnviado] = useState<Enviado | null>(inicial);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  if (enviado) return (
    <div className="mt-3 rounded-lg border bg-muted/30 p-3 text-sm">
      <p className="font-medium">E-mail enviado em {new Date(enviado.em).toLocaleString("pt-BR")} por {enviado.por}</p>
      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{enviado.texto}</p>
    </div>
  );
  if (!podeEnviar) return null;
  async function enviar() {
    setErro("");
    if (!texto.trim()) { setErro("Escreva o texto do e-mail."); return; }
    setEnviando(true);
    try { setEnviado(await enviarFn({ data: { numero, texto: texto.trim() } })); await qc.invalidateQueries({ queryKey: ["chamados"] }); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível enviar o e-mail."); }
    finally { setEnviando(false); }
  }
  return (
    <div className="mt-3 space-y-2 text-sm">
      {!aberto ? <Button variant="outline" size="sm" onClick={() => setAberto(true)}>Enviar e-mail</Button> : <>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} placeholder="Texto que será enviado ao solicitante (a assinatura é incluída automaticamente)" />
        <div className="flex gap-2"><Button size="sm" disabled={enviando} onClick={enviar}>{enviando ? "Enviando..." : "Enviar e-mail"}</Button><Button size="sm" variant="ghost" disabled={enviando} onClick={() => setAberto(false)}>Cancelar</Button></div>
      </>}
      {erro && <p role="alert" className="text-destructive">{erro}</p>}
    </div>
  );
}
