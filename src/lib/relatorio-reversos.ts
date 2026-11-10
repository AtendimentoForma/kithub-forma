export interface ReversoRel { numero: number; criado_em: string; status: string; destino: string; motivos: string[]; pax_nome: string; data_finalizacao?: string | null }
export type PeriodoRel = "7" | "30" | "mes" | "personalizado";
const DIA = 86_400_000;
const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function intervalo(periodo: PeriodoRel, de: string, ate: string, agora = new Date()): { inicio: Date; fim: Date } {
  const fim = new Date(inicioDia(agora).getTime() + DIA - 1);
  if (periodo === "mes") return { inicio: new Date(agora.getFullYear(), agora.getMonth(), 1), fim };
  if (periodo === "personalizado") {
    const i = de ? new Date(`${de}T00:00:00`) : new Date(0);
    const f = ate ? new Date(`${ate}T23:59:59.999`) : fim;
    return { inicio: i, fim: f };
  }
  return { inicio: new Date(inicioDia(agora).getTime() - (Number(periodo) - 1) * DIA), fim };
}

export function filtrar(lista: ReversoRel[], f: { inicio: Date; fim: Date; local: string; motivo: string; status: string }) {
  return lista.filter(r => {
    const t = new Date(r.criado_em).getTime();
    return t >= f.inicio.getTime() && t <= f.fim.getTime() && (!f.local || r.destino === f.local) && (!f.motivo || r.motivos.includes(f.motivo)) && (!f.status || r.status === f.status);
  });
}

export const diasEntre = (a: string | Date, b: string | Date) => Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / DIA));

export function resumo(lista: ReversoRel[], agora = new Date()) {
  const total = lista.length;
  const abertos = lista.filter(r => r.status === "NOVO REVERSO");
  const finalizados = lista.filter(r => r.status === "FINALIZADO");
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  const maisAntigo = [...abertos].sort((a, b) => a.criado_em.localeCompare(b.criado_em))[0];
  const comData = finalizados.filter(r => r.data_finalizacao);
  const media = comData.length ? comData.reduce((s, r) => s + (new Date(r.data_finalizacao!).getTime() - new Date(r.criado_em).getTime()) / DIA, 0) / comData.length : null;
  return { total, abertos: abertos.length, pctAbertos: pct(abertos.length), finalizados: finalizados.length, pctFinalizados: pct(finalizados.length),
    maisAntigo: maisAntigo ? { numero: maisAntigo.numero, dias: diasEntre(maisAntigo.criado_em, agora) } : null, mediaDias: media };
}

/** Conta cada pedido uma vez por valor; % sobre o total de pedidos (pode somar mais de 100%). */
export function contar(lista: ReversoRel[], chave: (r: ReversoRel) => string[]) {
  const m = new Map<string, number>();
  for (const r of lista) for (const v of new Set(chave(r))) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([nome, total]) => ({ nome, total, pct: lista.length ? (total / lista.length) * 100 : 0 }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"));
}

export function localPorMotivo(lista: ReversoRel[]) {
  const locais = contar(lista, r => [r.destino]);
  return locais.map(l => {
    const linha: Record<string, string | number> = { nome: l.nome };
    for (const r of lista) if (r.destino === l.nome) for (const m of new Set(r.motivos)) linha[m] = Number(linha[m] ?? 0) + 1;
    return linha;
  });
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function serie(lista: ReversoRel[], inicio: Date, fim: Date) {
  const ini = lista.length && inicio.getTime() === 0 ? inicioDia(new Date(Math.min(...lista.map(r => new Date(r.criado_em).getTime())))) : inicioDia(inicio);
  const semanal = (fim.getTime() - ini.getTime()) / DIA > 60;
  const base = (d: Date) => { const x = inicioDia(d); if (semanal) x.setDate(x.getDate() - x.getDay()); return x; };
  const cont = new Map<string, number>();
  for (const r of lista) { const k = iso(base(new Date(r.criado_em))); cont.set(k, (cont.get(k) ?? 0) + 1); }
  const pontos: { rotulo: string; total: number }[] = [];
  for (let d = base(ini); d <= fim; d.setDate(d.getDate() + (semanal ? 7 : 1))) {
    const r = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    pontos.push({ rotulo: semanal ? `Sem. ${r}` : r, total: cont.get(iso(d)) ?? 0 });
    if (pontos.length > 800) break;
  }
  return { semanal, pontos };
}

export function csv(lista: ReversoRel[], rotuloStatus: (s: string) => string) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const linhas = [["Número", "Cliente", "Local", "Motivos", "Status", "Data de abertura", "Data de finalização"].map(esc).join(";")];
  for (const r of lista) linhas.push([String(r.numero), r.pax_nome, r.destino, r.motivos.join(", "), rotuloStatus(r.status), new Date(r.criado_em).toLocaleDateString("pt-BR"), r.data_finalizacao ? new Date(r.data_finalizacao).toLocaleDateString("pt-BR") : "—"].map(esc).join(";"));
  return "\uFEFF" + linhas.join("\r\n");
}
