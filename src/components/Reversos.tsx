import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Plus, X } from "lucide-react";
import { z } from "zod";
import { Shell } from "./Shell";
import { Button } from "./ui/button";
import { EmptyState } from "./kithub-ui";
import { reversosQuery, type Reverso } from "@/lib/reversos";
import { AnexoViewer, type AnexoVisualizacao } from "./AnexoViewer";
import { anexoReversoSchema, STATUS_REVERSO, STATUS_REVERSO_LABEL, type AnexoReverso } from "@/lib/reversos-schema";
import { abrirAnexoReverso, atualizarStatusReverso, historicoReverso } from "@/lib/reversos.functions";
import { CampoEditavel } from "./CampoEditavel";
import { MotivosEditaveis } from "./MotivosEditaveis";
import { AnexosEditaveis } from "./AnexosEditaveis";
import { editarRegistro } from "@/lib/editar-registro.functions";
import { ORIGENS_REVERSO } from "@/lib/reversos-schema";
import { DESTINOS } from "@/lib/chamados";
import { mensagemDeErro, getMyRole, minhasPermissoesQuery, podeEditar } from "@/lib/chamados";

const ORDEM_REVERSO: Record<string, number> = { "NOVO REVERSO": 0, "REVERSO CONCLUÍDO": 1, "FINALIZADO": 2 };
const COR_REVERSO: Record<string, string> = {
  "NOVO REVERSO": "border-primary/40 bg-primary/15",
  "REVERSO CONCLUÍDO": "border-status-concluido/40 bg-status-concluido/15 text-status-concluido",
  "FINALIZADO": "border-status-finalizado/40 bg-status-finalizado/15 text-status-finalizado",
};

export function Reversos({ perfil, numero }: { perfil: "sac" | "lojinha"; numero?: number | undefined }) {
  const { data: lista } = useSuspenseQuery(reversosQuery);
  const [selecionado, setSelecionado] = useState<Reverso | undefined>(() => lista.find(r => r.numero === numero));
  const qc = useQueryClient();
  const { data: role = null } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const { data: permissoes } = useQuery(minhasPermissoesQuery);
  const podeAlterar = podeEditar(role, permissoes, "chamados") || podeEditar(role, permissoes, "reenvios");
  const [fStatus, setFStatus] = useState("");
  const [fDestino, setFDestino] = useState("");
  const [fNumero, setFNumero] = useState("");
  const filtrada = lista.filter(r => (!fStatus || r.status === fStatus) && (!fDestino || r.destino === fDestino) && (!fNumero.replace(/\D/g, "") || String(r.numero).includes(String(Number(fNumero.replace(/\D/g, ""))))));
  const destinosLista = [...new Set(lista.map(r => r.destino))].sort();
  const [anexoAberto, setAnexoAberto] = useState<AnexoVisualizacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [abrindo, setAbrindo] = useState(false);
  const { data: historico = [] } = useQuery({ queryKey: ["reverso-historico", selecionado?.numero], queryFn: () => historicoReverso({ data: { numero: selecionado!.numero } }), enabled: !!selecionado });
  const anexos = z.array(anexoReversoSchema).safeParse(selecionado?.anexos ?? []);
  useEffect(() => {
    if (!selecionado || anexoAberto) return;
    const fecharComEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setSelecionado(undefined); };
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [selecionado, anexoAberto]);
  async function abrir(anexo: AnexoReverso) {
    if (!selecionado) return;
    setErro(""); setAbrindo(true);
    try { const url = await abrirAnexoReverso({ data: { numero: selecionado.numero, caminho: anexo.caminho } }); setAnexoAberto({ ...anexo, url }); }
    catch (e) { setErro(mensagemDeErro(e, "Não foi possível abrir o anexo.")); }
    finally { setAbrindo(false); }
  }
  async function corrigir(patch: Record<string, unknown>) {
    if (!selecionado) return;
    const resultado = await editarRegistro({ data: { tipo: "reverso", numero: selecionado.numero, patch } });
    const patchSalvo = JSON.parse(resultado.patchJson) as Partial<Reverso>;
    setSelecionado(p => p ? { ...p, ...patchSalvo } : p);
    await qc.invalidateQueries({ queryKey: ["reversos"] });
  }
  const [finalizando, setFinalizando] = useState(false);
  const [textoFinal, setTextoFinal] = useState("");
  async function mudarStatus(status: typeof STATUS_REVERSO[number], finalizacao = "") {
    if (!selecionado) return;
    if (status === "FINALIZADO" && !finalizacao.trim()) { setErro("Para finalizar, preencha a descrição da finalização."); return; }
    setSalvando(true); setErro("");
    try {
      await atualizarStatusReverso({ data: { numero: selecionado.numero, status, finalizacao } });
      setSelecionado({ ...selecionado, status, ...(status === "FINALIZADO" ? { finalizacao: finalizacao.trim() } : {}) });
      setFinalizando(false); setTextoFinal("");
      await qc.invalidateQueries({ queryKey: ["reversos"] });
      await qc.invalidateQueries({ queryKey: ["reverso-historico", selecionado.numero] });
    } catch (e) { setErro(mensagemDeErro(e, "Não foi possível alterar o status.")); }
    finally { setSalvando(false); }
  }
  return <Shell title="Reversos" perfil={perfil}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div className="flex flex-wrap items-end gap-3 text-sm"><label className="grid gap-1">Número<input value={fNumero} onChange={e => setFNumero(e.target.value)} inputMode="numeric" placeholder="Ex.: 18" className="h-9 w-28 rounded-md border border-input bg-background px-2" /></label><label className="grid gap-1">Status<select value={fStatus} onChange={e => setFStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2"><option value="">Todos</option>{STATUS_REVERSO.map(s => <option key={s} value={s}>{STATUS_REVERSO_LABEL[s]}</option>)}</select></label><label className="grid gap-1">Destino<select value={fDestino} onChange={e => setFDestino(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2"><option value="">Todos</option>{destinosLista.map(d => <option key={d} value={d}>{d}</option>)}</select></label>{(fNumero || fStatus || fDestino) && <Button variant="outline" size="sm" onClick={() => { setFNumero(""); setFStatus(""); setFDestino(""); }}>Limpar filtros</Button>}</div><Button asChild><Link to={perfil === "sac" ? "/sac/reversos/novo" : "/lojinha/reversos/novo"}><Plus />Novo reverso</Link></Button></div>
    {!filtrada.length ? <EmptyState message={lista.length ? "Nenhum reverso encontrado com esses filtros." : "Nenhum reverso registrado."} /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-muted-foreground"><tr>{["Número", "Passageiro", "Status", "Destino", "Motivo", "Data"].map(t => <th key={t} className="px-4 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{[...filtrada].sort((a, b) => (ORDEM_REVERSO[a.status] ?? 9) - (ORDEM_REVERSO[b.status] ?? 9) || b.numero - a.numero).map(r => <tr key={r.numero} className="border-b transition hover:bg-accent/40"><td className="px-4 py-3"><Button variant="link" onClick={() => { setSelecionado(r); setErro(""); }}>#{String(r.numero).padStart(5, "0")}</Button></td><td className="px-4 py-3">{r.pax_nome}</td><td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full border px-2 py-1 text-xs ${COR_REVERSO[r.status] ?? COR_REVERSO["NOVO REVERSO"]}`}>{r.status}</span></td><td className="px-4 py-3">{r.destino}</td><td className="px-4 py-3">{r.motivos.join(", ")}</td><td className="whitespace-nowrap px-4 py-3">{new Date(r.criado_em).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div>}
    {selecionado && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/60 p-4" onClick={() => setSelecionado(undefined)}><div role="dialog" aria-modal="true" aria-labelledby="reverso-titulo" onClick={e => e.stopPropagation()} className="grid max-h-[85vh] w-full gap-4 overflow-y-auto rounded-lg border bg-background p-6 shadow-lg sm:max-w-2xl"><h2 id="reverso-titulo" className="text-lg font-semibold">Reverso #{String(selecionado.numero).padStart(5, "0")}</h2><p className="text-sm text-muted-foreground">{selecionado.solicitante} · {selecionado.perfil_origem === "sac" ? "SAC" : "Lojinha"} · {new Date(selecionado.criado_em).toLocaleString("pt-BR")}</p><dl className="grid gap-4 text-sm sm:grid-cols-2">{([
 ["Nome", "pax_nome"], ["CPF", "cpf"], ["ID do Pax", "pax_id"], ["ID Delivery", "id_delivery"], ["Nome do responsável", "responsavel"], ["Destino", "destino"], ["Ano", "ano"], ["Autorização Mandaê", "autorizacao_mandae"], ["Rastreamento Mandaê", "rastreamento_mandae"], ["Kit de outro destino", "kit_outro_destino"], ["Objeto danificado — o que aconteceu", "objeto_danificado"], ["Observação", "observacao"],
] as const).map(([label, campo]) => <CampoEditavel key={campo} label={label} valor={String(selecionado[campo] ?? "")} permitido={podeAlterar} opcoes={campo === "destino" ? DESTINOS : undefined} longo={["observacao", "objeto_danificado", "kit_outro_destino"].includes(campo)} salvar={async valor => corrigir({ [campo]: valor })} />)}<CampoEditavel label="Origem da solicitação" valor={selecionado.origem_solicitacao.join(", ")} permitido={podeAlterar} opcoes={ORIGENS_REVERSO} multiplo salvar={async valor => corrigir({ origem_solicitacao: valor ? valor.split(", ") : [] })} /><MotivosEditaveis tipo="reverso" motivos={selecionado.motivos} detalhes={{ kit_outro_destino: selecionado.kit_outro_destino ?? "", objeto_danificado: selecionado.objeto_danificado ?? "" }} permitido={podeAlterar} salvar={corrigir} /></dl><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-medium">Status: {STATUS_REVERSO_LABEL[selecionado.status as typeof STATUS_REVERSO[number]] ?? selecionado.status}</span>{podeAlterar && <label className="text-sm">Alterar status<select aria-label="Alterar status do reverso" value={finalizando ? "FINALIZADO" : selecionado.status} disabled={salvando} onChange={e => { const valor = e.target.value; setErro(""); if (valor === "FINALIZADO") { setFinalizando(true); return; } setFinalizando(false); if (valor === "NOVO REVERSO" || valor === "REVERSO CONCLUÍDO") void mudarStatus(valor); }} className="ml-2 rounded-md border border-input bg-background p-2">{STATUS_REVERSO.map(s => <option key={s} value={s}>{STATUS_REVERSO_LABEL[s]}</option>)}</select></label>}</div>{finalizando && <div className="grid gap-2"><label className="text-sm font-medium">Descrição da finalização *<textarea value={textoFinal} onChange={e => setTextoFinal(e.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-sm" /></label><div className="flex gap-2"><Button disabled={salvando || !textoFinal.trim()} onClick={() => void mudarStatus("FINALIZADO", textoFinal)}>Finalizar reverso</Button><Button variant="outline" onClick={() => { setFinalizando(false); setTextoFinal(""); }}>Cancelar</Button></div></div>}{selecionado.finalizacao && <div className="text-sm"><span className="font-medium">Finalização:</span> {selecionado.finalizacao}</div>}{anexos.success && anexos.data.map(a => <Button key={a.caminho} variant="outline" className="max-w-full justify-start" disabled={abrindo} onClick={() => void abrir(a)}><Paperclip /><span className="truncate">{a.nome}</span></Button>)}<AnexosEditaveis tipo="reverso" anexos={anexos.success ? anexos.data : []} permitido={podeAlterar} salvar={async lista => corrigir({ anexos: lista })} /><div className="grid gap-2 border-t pt-4"><h3 className="text-sm font-semibold">Histórico de status</h3>{historico.length ? <ol className="grid gap-2 text-sm">{historico.map(h => <li key={h.id} className="rounded-md border bg-muted/30 p-2"><div className="font-medium">{h.status_anterior ? `${STATUS_REVERSO_LABEL[h.status_anterior as typeof STATUS_REVERSO[number]] ?? h.status_anterior} → ` : ""}{STATUS_REVERSO_LABEL[h.status_novo as typeof STATUS_REVERSO[number]] ?? h.status_novo}</div><div className="text-xs text-muted-foreground">{h.autor_nome} ({h.perfil}) · {new Date(h.criado_em).toLocaleString("pt-BR")}</div>{h.texto && <div className="mt-1 text-xs">{h.texto}</div>}</li>)}</ol> : <p className="text-sm text-muted-foreground">Nenhuma alteração de status registrada.</p>}</div>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}<Button variant="outline" onClick={() => setSelecionado(undefined)}><X />Fechar</Button></div></div>}
    {anexoAberto && <AnexoViewer key={anexoAberto.url} anexo={anexoAberto} onClose={() => setAnexoAberto(null)} />}
  </Shell>;
}
