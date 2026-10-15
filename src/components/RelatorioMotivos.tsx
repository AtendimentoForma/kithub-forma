import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import { EmptyState } from "@/components/kithub-ui";
import { Button } from "@/components/ui/button";
import { chamadosQuery, DESTINOS, formatNumero } from "@/lib/chamados";
import { contarMotivos, agruparOutros, filtrarChamados, PERIODOS, serieTemporal, type Periodo } from "@/lib/relatorio";

const select = "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-hidden focus:border-primary focus:ring-3 focus:ring-primary/15";
const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

/** Dica ao passar o mouse ou focar com o teclado, só com CSS. */
function Dica({ children, texto, className = "" }: { children: React.ReactNode; texto: string; className?: string }) {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md group-focus-within:block group-hover:block">{texto}</span>
    </div>
  );
}

export function RelatorioMotivos() {
  const { data: lista = [], isLoading } = useQuery({ ...chamadosQuery, refetchInterval: 60000 });
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [destino, setDestino] = useState("todos");
  const [tabela, setTabela] = useState(false);

  const filtrados = useMemo(() => filtrarChamados(lista, periodo, destino), [lista, periodo, destino]);
  const motivos = useMemo(() => contarMotivos(filtrados), [filtrados]);
  const serie = useMemo(() => serieTemporal(filtrados, periodo), [filtrados, periodo]);
  const outros = useMemo(() => agruparOutros(filtrados), [filtrados]);
  const totalOutros = outros.reduce((n, o) => n + o.total, 0);
  const maxMotivo = Math.max(1, ...motivos.map((m) => m.total));
  const maxSerie = Math.max(1, ...serie.pontos.map((p) => p.total));
  const lider = motivos[0] && motivos[0].total > 0 ? motivos[0] : null;
  const unidade = serie.granularidade === "dia" ? "por dia" : serie.granularidade === "semana" ? "por semana" : "por mês";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <label className="block text-sm font-medium">Período
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className={select}>
            {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Destino
          <select value={destino} onChange={(e) => setDestino(e.target.value)} className={select}>
            <option value="todos">Todos os destinos</option>
            {DESTINOS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando chamados...</p>
      ) : filtrados.length === 0 ? (
        <div className="mt-8"><EmptyState message="Nenhum chamado no período e destino selecionados." /></div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="kithub-surface p-5">
              <p className="text-sm text-muted-foreground">Chamados no período</p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums">{filtrados.length}</p>
            </div>
            <div className="kithub-surface p-5 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Motivo mais frequente</p>
              <p className="mt-1 text-3xl font-extrabold">{lider?.motivo ?? "—"}</p>
              {lider && <p className="mt-1 text-sm text-muted-foreground">{lider.total} chamados ({pct(lider.percentual)} do total)</p>}
            </div>
          </div>

          <section className="kithub-surface mt-6 p-5 sm:p-6" aria-labelledby="rel-motivos">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="rel-motivos" className="font-semibold">Motivos das solicitações, do mais para o menos frequente</h2>
              <Button variant="outline" size="sm" onClick={() => setTabela((v) => !v)} aria-pressed={tabela}><Table2 /> {tabela ? "Ver gráfico" : "Ver tabela"}</Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Um chamado pode ter mais de um motivo, por isso os percentuais somam mais de 100%.</p>
            {tabela ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-4 font-semibold">#</th><th className="py-2 pr-4 font-semibold">Motivo</th><th className="py-2 pr-4 text-right font-semibold">Chamados</th><th className="py-2 text-right font-semibold">% dos chamados</th></tr></thead>
                  <tbody>
                    {motivos.map((m, i) => (
                      <tr key={m.motivo} className="border-b last:border-0"><td className="py-2 pr-4 tabular-nums">{i + 1}</td><td className="py-2 pr-4">{m.motivo}</td><td className="py-2 pr-4 text-right tabular-nums">{m.total}</td><td className="py-2 text-right tabular-nums">{pct(m.percentual)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ol className="mt-5 space-y-3">
                {motivos.map((m, i) => (
                  <li key={m.motivo} className="grid grid-cols-[1.25rem_minmax(7rem,12rem)_minmax(0,1fr)_7.5rem] items-center gap-3 text-sm">
                    <span className="text-xs tabular-nums text-muted-foreground">{i + 1}º</span>
                    <span className="truncate font-medium">{m.motivo}</span>
                    <Dica texto={`${m.motivo}: ${m.total} chamados (${pct(m.percentual)})`}>
                      <div className="h-7 rounded-r-md" tabIndex={0} role="img" aria-label={`${m.motivo}: ${m.total} chamados, ${pct(m.percentual)}`}>
                        <div className={`h-full rounded-r-md ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} style={{ width: `${Math.max((m.total / maxMotivo) * 100, m.total > 0 ? 1.5 : 0)}%` }} />
                      </div>
                    </Dica>
                    <span className="text-right tabular-nums"><strong>{m.total}</strong> <span className="text-muted-foreground">({pct(m.percentual)})</span></span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="kithub-surface mt-6 p-5 sm:p-6" aria-labelledby="rel-tempo">
            <h2 id="rel-tempo" className="font-semibold">Chamados abertos {unidade}</h2>
            <div className="mt-5 flex h-48 items-end gap-1 overflow-x-auto border-b pb-0" role="group" aria-label={`Chamados abertos ${unidade}`}>
              {serie.pontos.map((p) => (
                <Dica key={p.chave} className="flex h-full min-w-[14px] flex-1" texto={`${p.rotulo}: ${p.total} ${p.total === 1 ? "chamado" : "chamados"}`}>
                  <div className="flex h-full w-full flex-col justify-end" tabIndex={0} role="img" aria-label={`${p.rotulo}: ${p.total} chamados`}>
                    {p.total > 0 && <span className="mb-1 text-center text-[10px] tabular-nums text-muted-foreground">{p.total}</span>}
                    <div className="rounded-t-sm bg-primary" style={{ height: `${(p.total / maxSerie) * 80}%`, minHeight: p.total > 0 ? 3 : 0 }} />
                  </div>
                </Dica>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{serie.pontos[0]?.rotulo}</span><span>{serie.pontos.at(-1)?.rotulo}</span></div>
          </section>

          {outros.length > 0 && (
            <section className="kithub-surface mt-6 p-5 sm:p-6" aria-labelledby="rel-outro">
              <h2 id="rel-outro" className="font-semibold">Motivos "Outro" mais repetidos</h2>
              <p className="mt-1 text-xs text-muted-foreground">Textos iguais são unificados, sem diferenciar maiúsculas, acentos e pontuação. {totalOutros} {totalOutros === 1 ? "chamado" : "chamados"} no período.</p>
              <ol className="mt-4 divide-y text-sm">
                {outros.map((o, i) => (
                  <li key={o.texto} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-3 py-2.5">
                    <span className="text-xs tabular-nums text-muted-foreground">{i + 1}º</span>
                    <div className="min-w-0">
                      <p className="break-words font-medium">{o.texto}</p>
                      <p className="mt-0.5 break-words font-mono text-xs text-muted-foreground">{o.numeros.slice(0, 12).map(formatNumero).join(" · ")}{o.numeros.length > 12 ? ` · +${o.numeros.length - 12}` : ""}</p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${o.total > 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{o.total}x</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </>
  );
}
