import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/Shell";
import { ChamadoDetalhe } from "@/components/ChamadoDetalhe";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/kithub-ui";
import { DESTINOS, ORDEM_STATUS, posicaoStatus, chamadoNaoVisto, chamadosQuery, formatNumero, leiturasQuery, ultimasMovimentacoesQuery, type Chamado } from "@/lib/chamados";

/** Remove acentos e lower-case para busca tolerante. */
function normaliza(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Busca por ID do PAX, ID Delivery, Rastreio Mandaê, nome do passageiro e CPF. */
function correspondeBusca(c: Chamado, termo: string): boolean {
  const t = normaliza(termo);
  if (!t) return true;
  const campos = [String(c.numero), c.paxNome, c.cpf, c.paxId, c.idDelivery ?? "", c.rastreio, c.novoRastreio ?? ""];
  return campos.some((v) => normaliza(v).includes(t));
}

const CHAMADOS_POR_PAGINA = 10;

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
  const [ordem, setOrdem] = useState<Ordem>("status_asc");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [pagina, setPagina] = useState(1);
  const abertoChamado = list.find((c) => c.numero === aberto);

  const ordenados = useMemo(() => {
    const arr = list.filter((c) => correspondeBusca(c, busca) && (!filtroStatus || c.status === filtroStatus) && (!filtroDestino || c.destino === filtroDestino));
    switch (ordem) {
      case "num_asc": arr.sort((a, b) => a.numero - b.numero); break;
      case "num_desc": arr.sort((a, b) => b.numero - a.numero); break;
      case "tempo_maior": arr.sort((a, b) => esperaMs(b, ultimas) - esperaMs(a, ultimas)); break;
      case "tempo_menor": arr.sort((a, b) => esperaMs(a, ultimas) - esperaMs(b, ultimas)); break;
      case "status_asc": arr.sort((a, b) => posicaoStatus(a.status) - posicaoStatus(b.status) || b.numero - a.numero); break;
      case "status_desc": arr.sort((a, b) => posicaoStatus(b.status) - posicaoStatus(a.status) || b.numero - a.numero); break;
    }
    return arr;
  }, [list, ultimas, ordem, busca, filtroStatus, filtroDestino]);

  useEffect(() => { setPagina(1); }, [ordem, busca, filtroStatus, filtroDestino]);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / CHAMADOS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * CHAMADOS_POR_PAGINA;
  const visiveis = ordenados.slice(inicio, inicio + CHAMADOS_POR_PAGINA);

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
      <div className="mb-4 flex min-h-12 items-center gap-3 rounded-full border border-input bg-card px-5 shadow-xs focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por ID do PAX, ID Delivery, rastreio, nome do passageiro ou CPF..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Pesquisar chamado"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} aria-label="Filtrar por status" className="rounded-full border border-input bg-card px-4 py-2 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15">
          <option value="">Todos os status</option>
          {ORDEM_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)} aria-label="Filtrar por destino" className="rounded-full border border-input bg-card px-4 py-2 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15">
          <option value="">Todos os destinos</option>
          {DESTINOS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {(filtroStatus || filtroDestino) && <Button variant="ghost" size="sm" onClick={() => { setFiltroStatus(""); setFiltroDestino(""); }}>Limpar filtros</Button>}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
        {list.length === 0 ? (
          <EmptyState message="Nenhum chamado ainda." />
        ) : ordenados.length === 0 ? (
          <EmptyState message="Nenhum chamado encontrado para a busca ou filtros." />
        ) : (
          <>
            <div className="grid min-w-[720px] grid-cols-[minmax(0,1fr)_5rem_11rem_9rem] items-center gap-2 border-b bg-muted/60 px-5 py-3 text-xs font-semibold text-muted-foreground sm:gap-5">
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
            {visiveis.map((c) => {
              const ultima = ultimas[c.numero];
              const desde = ultima?.criadoEm ?? c.criadoEm;
              const naoVisto = chamadoNaoVisto(c, ultima, leituras);
              return (
                <Button
                  variant="ghost"
                  key={c.numero}
                  onClick={() => setAberto(c.numero)}
                  className={`grid h-auto min-w-[720px] w-full grid-cols-[minmax(0,1fr)_5rem_11rem_9rem] items-center gap-2 rounded-none border-b px-5 py-4 text-left text-sm last:border-0 hover:bg-accent/45 sm:gap-5 ${naoVisto ? "bg-primary/8 font-bold" : "font-normal"}`}
                >
                  <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                    {naoVisto && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" title="Nova movimentação" aria-label="Nova movimentação" />}
                    <span className="font-mono font-semibold">{formatNumero(c.numero)}</span>
                    <span className="truncate">{c.paxNome}</span>
                  </div>
                    <span className="justify-self-center">
                      {c.status !== "CONCLUÍDO" && c.status !== "PRIORIDADE FINALIZADA" && (
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
            {totalPaginas > 1 && (
              <nav aria-label="Paginação dos chamados" className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3 text-sm">
                <span className="text-muted-foreground">Mostrando {inicio + 1}–{inicio + visiveis.length} de {ordenados.length} chamados</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPagina(paginaAtual - 1)} disabled={paginaAtual <= 1}><ChevronLeft /> Anterior</Button>
                  <span className="min-w-24 text-center font-medium tabular-nums">Página {paginaAtual} de {totalPaginas}</span>
                  <Button variant="outline" size="sm" onClick={() => setPagina(paginaAtual + 1)} disabled={paginaAtual >= totalPaginas}>Próxima <ChevronRight /></Button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
      {abertoChamado && <ChamadoDetalhe chamado={abertoChamado} onClose={() => setAberto(null)} />}
    </>
  );
}
