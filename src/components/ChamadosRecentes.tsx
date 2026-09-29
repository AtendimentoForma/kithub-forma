import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/Shell";
import { ChamadoDetalhe } from "@/components/ChamadoDetalhe";
import { Button } from "@/components/ui/button";
import { chamadosQuery, formatNumero, leiturasQuery, ultimasMovimentacoesQuery, type Chamado } from "@/lib/chamados";

type Ordem = "num_desc" | "num_asc" | "tempo_maior" | "tempo_menor" | "status_asc" | "status_desc";

export function tempoEspera(desde: string): string {
  const ms = Date.now() - new Date(desde).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function esperaMs(c: Chamado, ultimas: Record<number, { criadoEm: string }>): number {
  return Date.now() - new Date(ultimas[c.numero]?.criadoEm ?? c.criadoEm).getTime();
}

function tempoClasse(ms: number) {
  if (ms <= 60 * 60 * 1000) return "bg-urgency-low/15 text-urgency-low";
  if (ms < 3 * 60 * 60 * 1000) return "bg-urgency-medium/15 text-urgency-medium";
  return "bg-destructive/10 text-destructive";
}

export function ChamadosRecentes() {
  const { data: list = [] } = useQuery({ ...chamadosQuery, refetchInterval: 15000 });
  const { data: ultimas = {} } = useQuery(ultimasMovimentacoesQuery);
  const { data: leituras } = useQuery(leiturasQuery);
  const [aberto, setAberto] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("num_desc");
  const abertoChamado = list.find((c) => c.numero === aberto);

  const ordenados = useMemo(() => {
    const arr = [...list];
    switch (ordem) {
      case "num_asc": arr.sort((a, b) => a.numero - b.numero); break;
      case "num_desc": arr.sort((a, b) => b.numero - a.numero); break;
      case "tempo_maior": arr.sort((a, b) => esperaMs(b, ultimas) - esperaMs(a, ultimas)); break;
      case "tempo_menor": arr.sort((a, b) => esperaMs(a, ultimas) - esperaMs(b, ultimas)); break;
      case "status_asc": arr.sort((a, b) => a.status.localeCompare(b.status, "pt-BR") || b.numero - a.numero); break;
      case "status_desc": arr.sort((a, b) => b.status.localeCompare(a.status, "pt-BR") || b.numero - a.numero); break;
    }
    return arr;
  }, [list, ultimas, ordem]);

  function ciclarNumero() {
    setOrdem((o) => (o === "num_desc" ? "num_asc" : "num_desc"));
  }
  function ciclarTempo() {
    setOrdem((o) => (o === "tempo_maior" ? "tempo_menor" : "tempo_maior"));
  }
  function ciclarStatus() {
    setOrdem((o) => (o === "status_asc" ? "status_desc" : "status_asc"));
  }

  const thBtn = "inline-flex items-center gap-1 hover:text-foreground";
  const iconNum = ordem === "num_desc" ? <ArrowDown className="h-3.5 w-3.5" /> : ordem === "num_asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  const iconTempo = ordem === "tempo_maior" ? <ArrowDown className="h-3.5 w-3.5" /> : ordem === "tempo_menor" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  const iconStatus = ordem === "status_asc" ? <ArrowUp className="h-3.5 w-3.5" /> : ordem === "status_desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-background">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum chamado ainda.</p>
        ) : (
          <>
            <div className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_5rem_11rem_9rem] items-center gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground sm:gap-5">
              <Button variant="ghost" size="sm" onClick={ciclarNumero} className={`${thBtn} h-7 justify-self-start px-0 text-xs`} title="Ordenar pelo número do chamado">
                Nº {iconNum}
              </Button>
              <Button variant="ghost" size="sm" onClick={ciclarTempo} className={`${thBtn} h-7 px-0 text-xs`} title="Ordenar pelo tempo desde a última movimentação">
                Tempo {iconTempo}
              </Button>
              <Button variant="ghost" size="sm" onClick={ciclarStatus} className={`${thBtn} h-7 justify-self-center px-0 text-xs`} title="Ordenar pelo status">
                Status {iconStatus}
              </Button>
              <span className="justify-self-center">Destino</span>
            </div>
            {ordenados.map((c) => {
              const ultima = ultimas[c.numero];
              const desde = ultima?.criadoEm ?? c.criadoEm;
              const vistoEm = leituras?.vistos[c.numero];
              const naoVisto = Boolean(c.status !== "CONCLUÍDO" && ultima && leituras && ultima.autorId !== leituras.usuarioId && (!vistoEm || new Date(ultima.criadoEm).getTime() > new Date(vistoEm).getTime()));
              return (
                <Button
                  variant="ghost"
                  key={c.numero}
                  onClick={() => setAberto(c.numero)}
                  className={`grid h-auto min-w-[720px] w-full grid-cols-[minmax(0,1fr)_5rem_11rem_9rem] items-center gap-2 rounded-none border-b px-4 py-4 text-left text-sm last:border-0 hover:bg-muted/40 sm:gap-5 ${naoVisto ? "bg-accent/60 font-bold" : "font-normal"}`}
                >
                  <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                    {naoVisto && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" title="Nova movimentação" aria-label="Nova movimentação" />}
                    <span className="font-mono font-semibold">{formatNumero(c.numero)}</span>
                    <span className="truncate">{c.paxNome}</span>
                  </div>
                    <span className="justify-self-center">
                      {c.status !== "CONCLUÍDO" && (
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${tempoClasse(esperaMs(c, ultimas))}`} title={`Última movimentação: ${new Date(desde).toLocaleString("pt-BR")}`}>
                          {tempoEspera(desde)}
                        </span>
                      )}
                    </span>
                    <span className="justify-self-center"><StatusBadge status={c.status} /></span>
                    <span className="justify-self-center truncate text-xs">{c.destino ?? "—"}</span>
                </Button>
              );
            })}
          </>
        )}
      </div>
      {abertoChamado && <ChamadoDetalhe chamado={abertoChamado} onClose={() => setAberto(null)} />}
    </>
  );
}
