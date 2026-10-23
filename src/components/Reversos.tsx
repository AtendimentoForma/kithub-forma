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
import { anexoReversoSchema, STATUS_REVERSO, type AnexoReverso } from "@/lib/reversos-schema";
import { abrirAnexoReverso, atualizarStatusReverso } from "@/lib/reversos.functions";
import { CampoEditavel } from "./CampoEditavel";
import { MotivosEditaveis } from "./MotivosEditaveis";
import { AnexosEditaveis } from "./AnexosEditaveis";
import { editarRegistro } from "@/lib/editar-registro.functions";
import { ORIGENS_REVERSO } from "@/lib/reversos-schema";
import { DESTINOS } from "@/lib/chamados";
import { mensagemDeErro, getMyRole, minhasPermissoesQuery, podeEditar } from "@/lib/chamados";

export function Reversos({ perfil, numero }: { perfil: "sac" | "lojinha"; numero?: number | undefined }) {
  const { data: lista } = useSuspenseQuery(reversosQuery);
  const [selecionado, setSelecionado] = useState<Reverso | undefined>(() => lista.find(r => r.numero === numero));
  const qc = useQueryClient();
  const { data: role = null } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const { data: permissoes } = useQuery(minhasPermissoesQuery);
  const podeAlterar = podeEditar(role, permissoes, "chamados") || podeEditar(role, permissoes, "reenvios");
  const [anexoAberto, setAnexoAberto] = useState<AnexoVisualizacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [abrindo, setAbrindo] = useState(false);
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
    setSelecionado(p => p ? { ...p, ...resultado.patch } as Reverso : p);
    await qc.invalidateQueries({ queryKey: ["reversos"] });
  }
  async function mudarStatus(status: typeof STATUS_REVERSO[number]) {
    if (!selecionado) return;
    setSalvando(true); setErro("");
    try {
      await atualizarStatusReverso({ data: { numero: selecionado.numero, status } });
      setSelecionado({ ...selecionado, status });
      await qc.invalidateQueries({ queryKey: ["reversos"] });
    } catch (e) { setErro(mensagemDeErro(e, "Não foi possível alterar o status.")); }
    finally { setSalvando(false); }
  }
  return <Shell title="Reversos" perfil={perfil}>
    <div className="mb-6 flex justify-end"><Button asChild><Link to={perfil === "sac" ? "/sac/reversos/novo" : "/lojinha/reversos/novo"}><Plus />Novo reverso</Link></Button></div>
    {!lista.length ? <EmptyState message="Nenhum reverso registrado." /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-muted-foreground"><tr>{["Número", "Passageiro", "Status", "Destino", "Motivo", "Data"].map(t => <th key={t} className="px-4 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{lista.map(r => <tr key={r.numero} className="border-b transition hover:bg-accent/40"><td className="px-4 py-3"><Button variant="link" onClick={() => { setSelecionado(r); setErro(""); }}>#{String(r.numero).padStart(5, "0")}</Button></td><td className="px-4 py-3">{r.pax_nome}</td><td className="px-4 py-3"><span className="whitespace-nowrap rounded-full border border-primary/40 bg-primary/15 px-2 py-1 text-xs">{r.status}</span></td><td className="px-4 py-3">{r.destino}</td><td className="px-4 py-3">{r.motivos.join(", ")}</td><td className="whitespace-nowrap px-4 py-3">{new Date(r.criado_em).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div>}
    {selecionado && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/60 p-4" onClick={() => setSelecionado(undefined)}><div role="dialog" aria-modal="true" aria-labelledby="reverso-titulo" onClick={e => e.stopPropagation()} className="grid max-h-[85vh] w-full gap-4 overflow-y-auto rounded-lg border bg-background p-6 shadow-lg sm:max-w-2xl"><h2 id="reverso-titulo" className="text-lg font-semibold">Reverso #{String(selecionado.numero).padStart(5, "0")}</h2><p className="text-sm text-muted-foreground">{selecionado.solicitante} · {selecionado.perfil_origem === "sac" ? "SAC" : "Lojinha"} · {new Date(selecionado.criado_em).toLocaleString("pt-BR")}</p><dl className="grid gap-4 text-sm sm:grid-cols-2">{([
 ["Nome", "pax_nome"], ["CPF", "cpf"], ["ID do Pax", "pax_id"], ["ID Delivery", "id_delivery"], ["Nome do responsável", "responsavel"], ["Destino", "destino"], ["Ano", "ano"], ["Autorização Mandaê", "autorizacao_mandae"], ["Rastreamento Mandaê", "rastreamento_mandae"], ["Kit de outro destino", "kit_outro_destino"], ["Objeto danificado — o que aconteceu", "objeto_danificado"], ["Observação", "observacao"],
] as const).map(([label, campo]) => <CampoEditavel key={campo} label={label} valor={String(selecionado[campo] ?? "")} permitido={podeAlterar} opcoes={campo === "destino" ? DESTINOS : undefined} longo={["observacao", "objeto_danificado", "kit_outro_destino"].includes(campo)} salvar={async valor => corrigir({ [campo]: valor })} />)}<CampoEditavel label="Origem da solicitação" valor={selecionado.origem_solicitacao.join(", ")} permitido={podeAlterar} opcoes={ORIGENS_REVERSO} multiplo salvar={async valor => corrigir({ origem_solicitacao: valor ? valor.split(", ") : [] })} /><MotivosEditaveis tipo="reverso" motivos={selecionado.motivos} detalhes={{ kit_outro_destino: selecionado.kit_outro_destino ?? "", objeto_danificado: selecionado.objeto_danificado ?? "" }} permitido={podeAlterar} salvar={corrigir} /></dl><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-medium">Status: {selecionado.status === "REVERSO CONCLUÍDO" ? "Reverso concluído" : "Novo reverso"}</span>{podeAlterar && <label className="text-sm">Alterar status<select aria-label="Alterar status do reverso" value={selecionado.status} disabled={salvando} onChange={e => { const valor = e.target.value; if (valor === "NOVO REVERSO" || valor === "REVERSO CONCLUÍDO") void mudarStatus(valor); }} className="ml-2 rounded-md border border-input bg-background p-2">{STATUS_REVERSO.map(s => <option key={s} value={s}>{s === "REVERSO CONCLUÍDO" ? "Reverso concluído" : "Novo reverso"}</option>)}</select></label>}</div>{anexos.success && anexos.data.map(a => <Button key={a.caminho} variant="outline" className="max-w-full justify-start" disabled={abrindo} onClick={() => void abrir(a)}><Paperclip /><span className="truncate">{a.nome}</span></Button>)}<AnexosEditaveis tipo="reverso" anexos={anexos.success ? anexos.data : []} permitido={podeAlterar} salvar={async lista => corrigir({ anexos: lista })} />{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}<Button variant="outline" onClick={() => setSelecionado(undefined)}><X />Fechar</Button></div></div>}
    {anexoAberto && <AnexoViewer key={anexoAberto.url} anexo={anexoAberto} onClose={() => setAnexoAberto(null)} />}
  </Shell>;
}
