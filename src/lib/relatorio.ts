import { MOTIVOS, type Chamado } from "@/lib/chamados";

export const PERIODOS = [
  { valor: "7", rotulo: "Últimos 7 dias" },
  { valor: "30", rotulo: "Últimos 30 dias" },
  { valor: "90", rotulo: "Últimos 90 dias" },
  { valor: "todos", rotulo: "Todo o período" },
] as const;
export type Periodo = (typeof PERIODOS)[number]["valor"];

const DIA = 24 * 60 * 60 * 1000;

export function filtrarChamados(lista: Chamado[], periodo: Periodo, destino: string, agora = Date.now()) {
  const desde = periodo === "todos" ? 0 : agora - Number(periodo) * DIA;
  return lista.filter((c) => new Date(c.criadoEm).getTime() >= desde && (destino === "todos" || c.destino === destino));
}

export interface MotivoContagem { motivo: string; total: number; percentual: number }

/** Um chamado pode ter vários motivos, então os percentuais (sobre chamados) somam mais de 100%. */
export function contarMotivos(lista: Chamado[]): MotivoContagem[] {
  const mapa = new Map<string, number>(MOTIVOS.map((m) => [m, 0]));
  for (const c of lista) for (const m of new Set(c.motivos)) mapa.set(m, (mapa.get(m) ?? 0) + 1);
  return [...mapa.entries()]
    .map(([motivo, total]) => ({ motivo, total, percentual: lista.length ? (total / lista.length) * 100 : 0 }))
    .sort((a, b) => b.total - a.total || a.motivo.localeCompare(b.motivo, "pt-BR"));
}

export interface PontoSerie { chave: string; rotulo: string; total: number }
type Granularidade = "dia" | "semana" | "mes";

function inicioDoDia(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function inicioDaSemana(d: Date) { const x = inicioDoDia(d); x.setDate(x.getDate() - x.getDay()); return x; }
function inicioDoMes(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function avancar(d: Date, g: Granularidade) {
  const x = new Date(d);
  if (g === "dia") x.setDate(x.getDate() + 1);
  else if (g === "semana") x.setDate(x.getDate() + 7);
  else x.setMonth(x.getMonth() + 1);
  return x;
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Chamados abertos ao longo do tempo, com os períodos vazios incluídos. */
export function serieTemporal(lista: Chamado[], periodo: Periodo, agora = new Date()): { granularidade: Granularidade; pontos: PontoSerie[] } {
  if (lista.length === 0) return { granularidade: "dia", pontos: [] };
  const menor = lista.reduce((a, c) => Math.min(a, new Date(c.criadoEm).getTime()), Infinity);
  const inicio = periodo === "todos" ? new Date(menor) : new Date(agora.getTime() - Number(periodo) * DIA);
  const dias = Math.max(1, Math.round((agora.getTime() - inicio.getTime()) / DIA));
  const granularidade: Granularidade = dias <= 31 ? "dia" : dias <= 120 ? "semana" : "mes";
  const base = granularidade === "dia" ? inicioDoDia : granularidade === "semana" ? inicioDaSemana : inicioDoMes;
  const contagem = new Map<string, number>();
  for (const c of lista) { const k = iso(base(new Date(c.criadoEm))); contagem.set(k, (contagem.get(k) ?? 0) + 1); }
  const pontos: PontoSerie[] = [];
  for (let d = base(inicio); d <= agora; d = avancar(d, granularidade)) {
    const rotulo = granularidade === "mes" ? d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    pontos.push({ chave: iso(d), rotulo: granularidade === "semana" ? `Sem. ${rotulo}` : rotulo, total: contagem.get(iso(d)) ?? 0 });
  }
  return { granularidade, pontos };
}

export interface OutroAgrupado { texto: string; total: number; numeros: number[] }

const chaveTexto = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Agrupa os textos digitados em "Outro" que sejam iguais (sem diferenciar maiúsculas, acentos e pontuação). */
export function agruparOutros(lista: Chamado[]): OutroAgrupado[] {
  const grupos = new Map<string, { variantes: Map<string, number>; numeros: number[] }>();
  for (const c of lista) {
    const texto = c.motivoOutro?.trim();
    if (!c.motivos.includes("Outro") || !texto) continue;
    const chave = chaveTexto(texto) || texto.toLowerCase();
    const g = grupos.get(chave) ?? { variantes: new Map<string, number>(), numeros: [] as number[] };
    g.variantes.set(texto, (g.variantes.get(texto) ?? 0) + 1);
    g.numeros.push(c.numero);
    grupos.set(chave, g);
  }
  return [...grupos.values()]
    .map((g) => ({
      texto: [...g.variantes.entries()].sort((a, b) => b[1] - a[1])[0]![0],
      total: g.numeros.length,
      numeros: g.numeros.sort((a, b) => b - a),
    }))
    .sort((a, b) => b.total - a.total || b.numeros[0]! - a.numeros[0]!);
}
