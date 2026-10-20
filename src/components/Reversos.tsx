import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Paperclip, Plus, X } from "lucide-react";
import { z } from "zod";
import { Shell } from "./Shell";
import { Button } from "./ui/button";
import { EmptyState } from "./kithub-ui";
import { reversosQuery, type Reverso } from "@/lib/reversos";
import { anexoReversoSchema } from "@/lib/reversos-schema";
import { abrirAnexoReverso } from "@/lib/reversos.functions";
import { mensagemDeErro } from "@/lib/chamados";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export function Reversos({ perfil, numero }: { perfil: "sac" | "lojinha"; numero?: number | undefined }) {
  const { data: lista } = useSuspenseQuery(reversosQuery);
  const [selecionado, setSelecionado] = useState<Reverso | undefined>(() => lista.find(r => r.numero === numero));
  const [erro, setErro] = useState("");
  const [abrindo, setAbrindo] = useState(false);
  const anexos = z.array(anexoReversoSchema).safeParse(selecionado?.anexos ?? []);
  async function abrir(caminho: string) {
    if (!selecionado) return;
    setErro(""); setAbrindo(true);
    try { const url = await abrirAnexoReverso({ data: { numero: selecionado.numero, caminho } }); window.location.assign(url); }
    catch (e) { setErro(mensagemDeErro(e, "Não foi possível abrir o anexo.")); }
    finally { setAbrindo(false); }
  }
  return <Shell title="Reversos" perfil={perfil}>
    <div className="mb-6 flex justify-end"><Button asChild><Link to={perfil === "sac" ? "/sac/reversos/novo" : "/lojinha/reversos/novo"}><Plus />Novo reverso</Link></Button></div>
    {!lista.length ? <EmptyState message="Nenhum reverso registrado." /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-muted-foreground"><tr>{["Número", "Passageiro", "Status", "Destino", "Motivo", "Data"].map(t => <th key={t} className="px-4 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{lista.map(r => <tr key={r.numero} className="border-b transition hover:bg-accent/40"><td className="px-4 py-3"><Button variant="link" onClick={() => { setSelecionado(r); setErro(""); }}>#{String(r.numero).padStart(5, "0")}</Button></td><td className="px-4 py-3">{r.pax_nome}</td><td className="px-4 py-3"><span className="whitespace-nowrap rounded-full border border-primary/40 bg-primary/15 px-2 py-1 text-xs">{r.status}</span></td><td className="px-4 py-3">{r.destino}</td><td className="px-4 py-3">{r.motivos.join(", ")}</td><td className="whitespace-nowrap px-4 py-3">{new Date(r.criado_em).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div>}
    <Dialog open={!!selecionado} onOpenChange={open => { if (!open) setSelecionado(undefined); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Reverso #{String(selecionado?.numero ?? "").padStart(5, "0")}</DialogTitle></DialogHeader>{selecionado && <><p className="text-sm text-muted-foreground">{selecionado.solicitante} · {selecionado.perfil_origem === "sac" ? "SAC" : "Lojinha"} · {new Date(selecionado.criado_em).toLocaleString("pt-BR")}</p><dl className="grid gap-4 text-sm sm:grid-cols-2">{Object.entries({ "Origem da solicitação": selecionado.origem_solicitacao.join(", "), "Nome": selecionado.pax_nome, "CPF": selecionado.cpf, "ID do Pax": selecionado.pax_id, "ID Delivery": selecionado.id_delivery, "Nome do responsável": selecionado.responsavel, "Destino": selecionado.destino, "Ano": selecionado.ano, "Autorização Mandaê": selecionado.autorizacao_mandae, "Rastreamento Mandaê": selecionado.rastreamento_mandae, "Motivo da solicitação": selecionado.motivos.join(", "), "Observação": selecionado.observacao || "—" }).map(([label, valor]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium whitespace-pre-wrap">{valor}</dd></div>)}</dl>{anexos.success && anexos.data.map(a => <Button key={a.caminho} variant="outline" className="max-w-full justify-start" disabled={abrindo} onClick={() => void abrir(a.caminho)}><Paperclip /><span className="truncate">{a.nome}</span></Button>)}{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}<Button variant="outline" onClick={() => setSelecionado(undefined)}><X />Fechar</Button></>}</DialogContent></Dialog>
  </Shell>;
}
