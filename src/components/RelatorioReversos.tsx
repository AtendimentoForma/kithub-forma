import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Download, LoaderCircle, Inbox } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Button } from "./ui/button";
import { reversosQuery } from "@/lib/reversos";
import { MOTIVOS_REVERSO, STATUS_REVERSO, STATUS_REVERSO_LABEL } from "@/lib/reversos-schema";
import { contar, csv, diasEntre, filtrar, intervalo, localPorMotivo, resumo, serie, type PeriodoRel, type ReversoRel } from "@/lib/relatorio-reversos";

const num = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const data = (d: Date | string) => new Date(d).toLocaleDateString("pt-BR");
const COR_STATUS: Record<string, string> = { "NOVO REVERSO": "var(--color-primary)", "REVERSO CONCLUÍDO": "var(--color-status-concluido)", "FINALIZADO": "var(--color-status-finalizado)" };
const COR_MOTIVO = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
const rotulo = (s: string) => STATUS_REVERSO_LABEL[s as keyof typeof STATUS_REVERSO_LABEL] ?? s;
const sel = "h-10 rounded-lg border border-input bg-background px-3 text-sm";
const tip = { contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-popover-foreground)" } };

function Painel({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: string }) {
  return <section className="rounded-xl border border-border bg-card p-4 shadow-sm"><h3 className="mb-3 font-semibold">{titulo}</h3>{children}{nota && <p className="mt-2 text-xs text-muted-foreground">{nota}</p>}</section>;
}
function Cartao({ titulo, valor, extra }: { titulo: string; valor: string; extra?: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">{titulo}</p><p className="mt-1 text-2xl font-bold">{valor}</p>{extra && <p className="text-xs text-muted-foreground">{extra}</p>}</div>;
}
const NOTA = "Um pedido pode ter mais de um motivo e é contado em cada um; as porcentagens são sobre os pedidos do período e podem somar mais de 100%.";

export function RelatorioReversos({ perfil }: { perfil: "sac" | "lojinha" }) {
  const { data: lista, isLoading } = useQuery(reversosQuery);
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoRel>("30");
  const [de, setDe] = useState(""); const [ate, setAte] = useState("");
  const [local, setLocal] = useState(""); const [motivo, setMotivo] = useState(""); const [status, setStatus] = useState("");
  const todos = (lista ?? []) as ReversoRel[];
  const faixa = useMemo(() => intervalo(periodo, de, ate), [periodo, de, ate]);
  const f = useMemo(() => filtrar(todos, { ...faixa, local, motivo, status }), [todos, faixa, local, motivo, status]);
  const locais = [...new Set(todos.map(r => r.destino))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const s = resumo(f);
  const porStatus = STATUS_REVERSO.map(st => ({ nome: rotulo(st), st, total: f.filter(r => r.status === st).length })).filter(x => x.total);
  const motivos = contar(f, r => r.motivos);
  const porLocal = contar(f, r => [r.destino]);
  const lxm = localPorMotivo(f);
  const evol = serie(f, faixa.inicio, faixa.fim);
  const abertos = f.filter(r => r.status === "NOVO REVERSO").sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const filtrosAtivos = periodo !== "30" || local || motivo || status;
  const textoPeriodo = faixa.inicio.getTime() === 0 ? `Até ${data(faixa.fim)}` : `${data(faixa.inicio)} a ${data(faixa.fim)}`;
  function limpar() { setPeriodo("30"); setDe(""); setAte(""); setLocal(""); setMotivo(""); setStatus(""); }
  function exportar() {
    const url = URL.createObjectURL(new Blob([csv(f, rotulo)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "relatorio-reversos.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  const altura = (n: number) => Math.max(160, n * 36);
  const tipPct = (v: number) => [`${num(v)} (${pct(f.length ? (v / f.length) * 100 : 0)})`, "Pedidos"];

  if (isLoading) return <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /> Carregando relatório…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">Período
            <select className={sel} value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoRel)}>
              <option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="mes">Mês atual</option><option value="personalizado">Personalizado</option>
            </select></label>
          {periodo === "personalizado" && <>
            <label className="grid gap-1 text-sm">De<input type="date" className={sel} value={de} onChange={e => setDe(e.target.value)} /></label>
            <label className="grid gap-1 text-sm">Até<input type="date" className={sel} value={ate} onChange={e => setAte(e.target.value)} /></label>
          </>}
          <label className="grid gap-1 text-sm">Local<select className={sel} value={local} onChange={e => setLocal(e.target.value)}><option value="">Todos</option>{locais.map(l => <option key={l}>{l}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Motivo<select className={sel} value={motivo} onChange={e => setMotivo(e.target.value)}><option value="">Todos</option>{MOTIVOS_REVERSO.map(m => <option key={m}>{m}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Status<select className={sel} value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option>{STATUS_REVERSO.map(st => <option key={st} value={st}>{rotulo(st)}</option>)}</select></label>
          <div className="ml-auto flex gap-2">
            {filtrosAtivos && <Button variant="outline" onClick={limpar}>Limpar filtros</Button>}
            <Button onClick={exportar} disabled={!f.length}><Download /> Exportar CSV</Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Período: <strong className="text-foreground">{textoPeriodo}</strong> · {num(f.length)} pedido(s)</p>
      </div>

      {!f.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground"><Inbox className="h-8 w-8" /><p>Nenhum pedido encontrado com esses filtros.</p><p className="text-sm">Tente ampliar o período ou limpar os filtros.</p></div>
      ) : <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Cartao titulo="Total de pedidos" valor={num(s.total)} />
          <Cartao titulo="Novo reverso (em aberto)" valor={num(s.abertos)} extra={`${pct(s.pctAbertos)} do total`} />
          <Cartao titulo="Finalizados" valor={num(s.finalizados)} extra={`Taxa de conclusão: ${pct(s.pctFinalizados)}`} />
          <Cartao titulo="Em aberto mais antigo" valor={s.maisAntigo ? `Nº ${String(s.maisAntigo.numero).padStart(5, "0")}` : "—"} extra={s.maisAntigo ? `Há ${num(s.maisAntigo.dias)} dia(s) como Novo reverso` : "Nenhum em aberto"} />
          <Cartao titulo="Tempo médio de resolução" valor={s.mediaDias === null ? "—" : `${s.mediaDias.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`} extra="Só pedidos finalizados com data registrada" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Painel titulo="Status dos pedidos">
            <ResponsiveContainer width="100%" height={260}><PieChart>
              <Pie data={porStatus} dataKey="total" nameKey="nome" innerRadius={60} outerRadius={95} paddingAngle={2}>{porStatus.map(p => <Cell key={p.st} fill={COR_STATUS[p.st]} />)}</Pie>
              <Tooltip {...tip} formatter={(v: number) => tipPct(v)} />
              <Legend formatter={(v: string) => { const p = porStatus.find(x => x.nome === v); return `${v}: ${num(p?.total ?? 0)} (${pct(p ? (p.total / f.length) * 100 : 0)})`; }} />
            </PieChart></ResponsiveContainer>
          </Painel>
          <Painel titulo="Principais motivos" nota={NOTA}>
            <ResponsiveContainer width="100%" height={altura(motivos.length)}><BarChart data={motivos} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 12 }} />
              <Tooltip {...tip} formatter={(v: number) => tipPct(v)} /><Bar dataKey="total" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
            </BarChart></ResponsiveContainer>
          </Painel>
          <Painel titulo="Pedidos por local">
            <ResponsiveContainer width="100%" height={altura(porLocal.length)}><BarChart data={porLocal} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 12 }} />
              <Tooltip {...tip} formatter={(v: number) => tipPct(v)} /><Bar dataKey="total" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
            </BarChart></ResponsiveContainer>
          </Painel>
          <Painel titulo="Local x motivo" nota={NOTA}>
            <ResponsiveContainer width="100%" height={altura(lxm.length) + 40}><BarChart data={lxm} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 12 }} />
              <Tooltip {...tip} formatter={(v: number, n: string, item: { payload?: Record<string, unknown> }) => { const t = porLocal.find(l => l.nome === item.payload?.["nome"])?.total ?? 0; return [`${num(v)} (${pct(t ? (v / t) * 100 : 0)} do local)`, n]; }} />
              <Legend />{MOTIVOS_REVERSO.map((m, i) => <Bar key={m} dataKey={m} stackId="a" fill={COR_MOTIVO[i % COR_MOTIVO.length]} />)}
            </BarChart></ResponsiveContainer>
          </Painel>
          <Painel titulo={`Evolução no tempo (pedidos abertos por ${evol.semanal ? "semana" : "dia"})`}>
            <ResponsiveContainer width="100%" height={260}><LineChart data={evol.pontos} margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="rotulo" tick={{ fontSize: 11 }} minTickGap={16} /><YAxis allowDecimals={false} />
              <Tooltip {...tip} formatter={(v: number) => tipPct(v)} /><Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer>
          </Painel>
          <Painel titulo="Produtos com mais pedidos">
            <p className="text-sm text-muted-foreground">Os pedidos de reverso ainda não registram quais produtos foram devolvidos, então não há dados para os gráficos de produtos e de produto x motivo. Eles podem ser criados quando esse campo for incluído no formulário.</p>
          </Painel>
        </div>

        <Painel titulo={`Pedidos em aberto (${num(abertos.length)})`}>
          {!abertos.length ? <p className="text-sm text-muted-foreground">Nenhum pedido em aberto neste filtro.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-2">Nº</th><th className="p-2">Cliente</th><th className="p-2">Local</th><th className="p-2">Motivo(s)</th><th className="p-2">Produto(s)</th><th className="p-2">Abertura</th><th className="p-2 text-right">Dias em aberto</th></tr></thead>
              <tbody>{abertos.map(r => { const d = diasEntre(r.criado_em, new Date()); return (
                <tr key={r.numero} onClick={() => navigate({ to: perfil === "sac" ? "/sac/reversos" : "/lojinha/reversos", search: { numero: r.numero } })} className={`cursor-pointer border-b border-border hover:bg-muted/50 ${d > 7 ? "bg-urgency-medium/10 text-urgency-medium font-medium" : ""}`}>
                  <td className="p-2">{String(r.numero).padStart(5, "0")}</td><td className="p-2">{r.pax_nome}</td><td className="p-2">{r.destino}</td><td className="p-2">{r.motivos.join(", ")}</td><td className="p-2">—</td><td className="p-2">{data(r.criado_em)}</td><td className="p-2 text-right">{num(d)}</td>
                </tr>); })}</tbody>
            </table></div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Em âmbar: abertos há mais de 7 dias. Clique na linha para abrir o pedido.</p>
        </Painel>
      </>}
    </div>
  );
}
