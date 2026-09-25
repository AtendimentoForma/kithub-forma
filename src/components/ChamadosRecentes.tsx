import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/Shell";
import { ChamadoDetalhe } from "@/components/ChamadoDetalhe";
import { chamadosQuery, formatNumero, ultimasMovimentacoesQuery, type Chamado } from "@/lib/chamados";

type Ordem = "num_desc" | "num_asc" | "espera_maior" | "espera_menor";

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

function esperaMs(c: Chamado, ultimas: Record<number, string>): number {
  return Date.now() - new Date(ultimas[c.numero] ?? c.criadoEm).getTime();
}

export function ChamadosRecentes() {
  const { data: list = [] } = useQuery(chamadosQuery);
  const { data: ultimas = {} } = useQuery(ultimasMovimentacoesQuery);
  const [aberto, setAberto] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("num_desc");
  const abertoChamado = list.find((c) => c.numero === aberto);

  const ordenados = useMemo(() => {
    const arr = [...list];
    switch (ordem) {
      case "num_asc": arr.sort((a, b) => a.numero - b.numero); break;
      case "num_desc": arr.sort((a, b) => b.numero - a.numero); break;
      case "espera_maior": arr.sort((a, b) => esperaMs(b, ultimas) - esperaMs(a, ultimas)); break;
      case "espera_menor": arr.sort((a, b) => esperaMs(a, ultimas) - esperaMs(b, ultimas)); break;
    }
    return arr;
  }, [list, ultimas, ordem]);

  function ciclarNumero() {
    setOrdem((o) => (o === "num_desc" ? "num_asc" : "num_desc"));
  }
  function ciclarEspera() {
    setOrdem((o) => (o === "espera_maior" ? "espera_menor" : "espera_maior"));
  }

  const thBtn = "inline-flex items-center gap-1 hover:text-foreground";
  const iconNum = ordem === "num_desc" ? <ArrowDown className="h-3.5 w-3.5" /> : ordem === "num_asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  const iconEsp = ordem === "espera_maior" ? <ArrowDown className="h-3.5 w-3.5" /> : ordem === "espera_menor" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;

  return (
    <>
      <div className="rounded-xl border bg-background">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum chamado ainda.</p>
        ) : (
          <>
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              <button onClick={ciclarNumero} className={thBtn} title="Ordenar pelo número do chamado">
                Nº {iconNum}
              </button>
              <button onClick={ciclarEspera} className={thBtn} title="Ordenar pelo tempo de espera">
                Espera {iconEsp}
              </button>
            </div>
            {ordenados.map((c) => {
              const desde = ultimas[c.numero] ?? c.criadoEm;
              return (
                <button
                  key={c.numero}
                  onClick={() => setAberto(c.numero)}
                  className="flex w-full items-center justify-between border-b p-4 text-left last:border-0 hover:bg-muted/40"
                >
                  <div>
                    <span className="font-mono font-semibold">{formatNumero(c.numero)}</span>
                    <span className="ml-3">{c.paxNome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive" title={`Última movimentação: ${new Date(desde).toLocaleString("pt-BR")}`}>
                      {tempoEspera(desde)}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
      {abertoChamado && <ChamadoDetalhe chamado={abertoChamado} onClose={() => setAberto(null)} />}
    </>
  );
}
