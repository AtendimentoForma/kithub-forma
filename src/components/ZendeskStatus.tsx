import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { reenviarChamadoZendesk } from "@/lib/zendesk.functions";

export type ResultadoZd = { ok: true; ticketId: number; ticketUrl: string; emailEnviado: boolean; jaEnviado?: boolean } | { ok: false; erro: string };

export function ZendeskResultado({ numero, inicial }: { numero: number; inicial: ResultadoZd | null }) {
  const [r, setR] = useState<ResultadoZd | null>(inicial);
  const [enviando, setEnviando] = useState(false);
  const reenviar = useServerFn(reenviarChamadoZendesk);
  async function tentar() {
    setEnviando(true);
    try { setR(await reenviar({ data: { numero } })); }
    catch (e) { setR({ ok: false, erro: e instanceof Error ? e.message : "Falha ao reenviar." }); }
    finally { setEnviando(false); }
  }
  if (r?.ok) return (
    <div className="mt-4 space-y-1 text-sm">
      <p className="font-medium">Chamado enviado para a Zendesk (ticket{" "}
        {r.ticketUrl ? <a href={r.ticketUrl} target="_blank" rel="noreferrer" className="underline">#{r.ticketId}</a> : `#${r.ticketId}`})</p>
      <p className="text-muted-foreground">E-mail enviado: {r.emailEnviado ? "Sim" : "Não"}</p>
    </div>
  );
  return (
    <div className="mt-4 space-y-2 text-sm">
      {r && !r.ok && <p role="alert" className="text-destructive">Não foi possível enviar para a Zendesk: {r.erro}</p>}
      {!r && <p className="text-muted-foreground">Ainda não enviado para a Zendesk.</p>}
      <Button variant="outline" size="sm" onClick={tentar} disabled={enviando}>{enviando ? "Enviando..." : "Reenviar para a Zendesk"}</Button>
    </div>
  );
}
