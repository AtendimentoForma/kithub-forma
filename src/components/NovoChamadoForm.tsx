import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronUp, Paperclip, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DESTINOS, MOTIVOS, addMovimentacao, formatNumero, mensagemDeErro, getMyRole, minhasPermissoesQuery, podeEditar, statusSelecionaveis, type Status } from "@/lib/chamados";
import { criarChamado } from "@/lib/criar-chamado.functions";
import { buscarCep, enderecoSchema, ESTADOS, mascararCep } from "@/lib/endereco";

const input = "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-hidden focus:border-primary focus:ring-3 focus:ring-primary/15";

function Field({ label, name, type = "text", required = true, placeholder, maxLength = 255, inputMode, onChange, disabled }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; maxLength?: number; inputMode?: "numeric"; onChange?: (e: ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
  return (
    <label className="block text-sm font-medium">
      {label}{required && " *"}
      <Input name={name} type={type} required={required} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} onChange={onChange} disabled={disabled} className="mt-1.5" />
    </label>
  );
}

export function NovoChamadoForm({ listaPath }: { listaPath: "/lojinha/chamados" | "/sac/chamados" }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [motivos, setMotivos] = useState<string[]>([]);
  const [origens, setOrigens] = useState<string[]>([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("NOVO CHAMADO");
  const [statusCriado, setStatusCriado] = useState<Status>("NOVO CHAMADO");
  const [menuAberto, setMenuAberto] = useState(false);
  const [anexos, setAnexos] = useState<File[]>([]);
  const anexosRef = useRef<HTMLInputElement>(null);
  const { data: perfil = null } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const { data: permissoes } = useQuery(minhasPermissoesQuery);
  const podeCriar = podeEditar(perfil, permissoes, "chamados") || podeEditar(perfil, permissoes, "reenvios");
  const statusDisponiveis = statusSelecionaveis(listaPath === "/sac/chamados" ? "sac" : "lojinha");

  const cepBusca = useRef<AbortController | null>(null);
  const [cepMsg, setCepMsg] = useState("");

  async function aoDigitarCep(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const form = input.form;
    input.value = mascararCep(input.value);
    cepBusca.current?.abort();
    setCepMsg("");
    if (!form || input.value.length !== 9) return;
    const ctrl = new AbortController();
    cepBusca.current = ctrl;
    setCepMsg("Buscando endereço...");
    try {
      const end = await buscarCep(input.value, ctrl.signal);
      if (!end) return setCepMsg("CEP não encontrado. Preencha o endereço manualmente.");
      const preencher = (nome: string, valor: string) => {
        const el = form.elements.namedItem(nome) as HTMLInputElement | HTMLSelectElement | null;
        if (el && valor) el.value = valor;
      };
      preencher("logradouro", end.logradouro);
      preencher("bairro", end.bairro);
      preencher("cidade", end.cidade);
      preencher("estado", end.estado);
      setCepMsg("");
      (form.elements.namedItem(end.logradouro ? "numero" : "logradouro") as HTMLInputElement | null)?.focus();
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setCepMsg("Não foi possível buscar o CEP agora. Preencha o endereço manualmente.");
    }
  }

  function atualizarAnexos(lista: FileList | null) {
    setAnexos(lista ? Array.from(lista) : []);
  }

  function removerAnexo(i: number) {
    const restantes = anexos.filter((_, idx) => idx !== i);
    setAnexos(restantes);
    const dt = new DataTransfer();
    restantes.forEach((f) => dt.items.add(f));
    if (anexosRef.current) anexosRef.current.files = dt.files;
  }

  function toggle(m: string) {
    setMotivos((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  }

  function toggleOrigem(o: string) {
    setOrigens((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    if (!g("idDelivery")) return setErro("Preencha o ID Delivery.");
    if (motivos.length === 0) return setErro("Selecione ao menos um motivo.");
    if (origens.length === 0) return setErro("Marque ao menos uma opção: \"Cliente entrou em contato\" ou \"Identificado internamente\".");
    if (g("cpf").replace(/\D/g, "").length !== 11) return setErro("CPF deve ter 11 dígitos.");
    const enderecoValidado = enderecoSchema.safeParse({
      cep: g("cep"), logradouro: g("logradouro"), numero: g("numero"), complemento: g("complemento"),
      bairro: g("bairro"), cidade: g("cidade"), estado: g("estado"), pais: g("pais"), referencia: g("referencia"),
    });
    if (!enderecoValidado.success) return setErro(enderecoValidado.error.issues[0]?.message ?? "Confira os dados do endereço.");
    if (motivos.includes("Outro") && !g("motivoOutro")) return setErro("Descreva o motivo \"Outro\".");
    if (["CONCLUÍDO", "REENVIO AUTORIZADO", "AGUARDANDO CLIENTE", "ANÁLISE LIDERANÇA"].includes(status) && !g("observacao")) return setErro(`Para enviar como "${status}", preencha a observação.`);
    const nomesAnexos = anexos.map((x) => x.name);
    setErro("");
    setEnviando(true);
    let novoNumero: number | null = null;
    try {
      const c = await criarChamado({ data: {
        statusInicial: status,
        paxNome: g("paxNome"), cpf: g("cpf"), paxId: g("paxId"), idDelivery: g("idDelivery"), destino: g("destino"), ano: g("ano"), responsavel: g("responsavel"),
        rastreio: g("rastreio"), endereco: enderecoValidado.data, dataEnvio: g("dataEnvio"),
        motivos, motivoOutro: g("motivoOutro") || null, origemSolicitacao: origens.join(", "),
        observacao: g("observacao") || null, anexos: nomesAnexos,
      } });
      novoNumero = c.numero;
      setCriado(c.numero);
      if (status !== "NOVO CHAMADO") {
        await addMovimentacao(c.numero, g("observacao") || null, status);
        setStatusCriado(status);
      }
    } catch (err) {
      setErro(novoNumero !== null
        ? `O chamado ${formatNumero(novoNumero)} foi criado como NOVO CHAMADO, mas não foi possível alterar o status: ${mensagemDeErro(err, "Tente alterar o status na lista de chamados.")}`
        : mensagemDeErro(err, "Não foi possível enviar o chamado."));
    } finally {
      if (novoNumero !== null) {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["chamados"] }),
          qc.invalidateQueries({ queryKey: ["ultimas-movimentacoes"] }),
        ]);
      }
      setEnviando(false);
    }
  }

  if (criado !== null)
    return (
      <Shell title="Chamado criado">
        <div className="kithub-surface p-8 text-center">
          <div className="font-mono text-3xl font-bold">{formatNumero(criado)}</div>
          <p className="mt-2 text-muted-foreground">Status: {statusCriado}</p>
          {erro && <p role="alert" className="mt-3 text-sm text-destructive">{erro}</p>}
          <Button onClick={() => navigate({ to: listaPath })} className="mt-6">Ver chamados</Button>
        </div>
      </Shell>
    );

  if (!podeCriar)
    return (
      <Shell title="Novo chamado de reenvio">
        <p className="kithub-surface p-6 text-sm text-muted-foreground">
          Seu acesso é somente de consulta. Peça ao administrador a função "Chamados" para abrir novos chamados.
        </p>
      </Shell>
    );

  return (
    <Shell title="Novo chamado de reenvio">
      <form onSubmit={submit} className="space-y-6">
        <section className="kithub-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Origem da solicitação *</h2>
          <div className="flex flex-wrap gap-4">
            {["Cliente entrou em contato", "Identificado internamente"].map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={origens.includes(o)} onChange={() => toggleOrigem(o)} className="h-4 w-4 accent-primary" /> {o}
              </label>
            ))}
          </div>
        </section>
        <section className="kithub-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Dados do passageiro</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" name="paxNome" />
            <Field label="CPF" name="cpf" placeholder="000.000.000-00" />
            <Field label="ID do Pax" name="paxId" />
            <Field label="ID Delivery" name="idDelivery" />
            <Field label="Nome do responsável" name="responsavel" />
          </div>
        </section>
        <section className="kithub-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Viagem</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Destino *
              <select name="destino" required defaultValue="" className={input}>
                <option value="" disabled>Selecione o destino</option>
                {DESTINOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <Field label="Ano" name="ano" />
          </div>
        </section>
        <section className="kithub-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Dados do envio original</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nº rastreio Mandaê" name="rastreio" />
            <Field label="Data do envio" name="dataEnvio" type="date" />
          </div>
          <h3 className="mb-4 mt-6 font-semibold">Endereço utilizado</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Field label="CEP" name="cep" placeholder="00000-000" maxLength={9} inputMode="numeric" onChange={aoDigitarCep} />
              {cepMsg && <p className="mt-1.5 text-xs text-muted-foreground" role="status">{cepMsg}</p>}
            </div>
            <Field label="Endereço" name="logradouro" maxLength={80} />
            <Field label="Número" name="numero" maxLength={20} />
            <Field label="Complemento" name="complemento" required={false} maxLength={60} />
            <Field label="Bairro" name="bairro" maxLength={40} />
            <Field label="Cidade" name="cidade" maxLength={40} />
            <label className="block text-sm font-medium">Estado *
              <select name="estado" required defaultValue="" className={input}>
                <option value="" disabled>Selecione o estado</option>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">País *
              <input name="pais" required defaultValue="Brasil" maxLength={40} className={input} />
            </label>
            <Field label="Ponto de referência" name="referencia" required={false} maxLength={100} />
          </div>
        </section>
        <section className="kithub-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Motivo da solicitação *</h2>
          <div className="flex flex-wrap gap-4">
            {MOTIVOS.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={motivos.includes(m)} onChange={() => toggle(m)} className="h-4 w-4 accent-primary" /> {m}
              </label>
            ))}
          </div>
          {motivos.includes("Outro") && <div className="mt-4"><Field label="Descreva o motivo" name="motivoOutro" /></div>}
        </section>
        <section className="kithub-surface p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Informações adicionais (opcional)</h2>
          <label className="block text-sm font-medium">Observação / descrição
            <Textarea name="observacao" rows={4} maxLength={1000} className="mt-1.5" />
          </label>
          <div className="mt-4">
            <span className="block text-sm font-medium">Anexar fotos / documentos</span>
            <label
              htmlFor="anexos-input"
              className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent/50"
            >
              <Paperclip className="h-4 w-4 text-primary" />
              {anexos.length === 0 ? "Escolher arquivos" : "Adicionar mais arquivos"}
            </label>
            <input
              ref={anexosRef}
              id="anexos-input"
              name="anexos"
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => atualizarAnexos(e.target.files)}
              className="hidden"
            />
            {anexos.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {anexos.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
                    <span className="flex items-center gap-2 truncate text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-xs">({(f.size / 1024).toFixed(0)} KB)</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerAnexo(i)}
                      aria-label={`Remover ${f.name}`}
                      className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
        <div className="relative inline-flex max-w-full items-stretch">
          <Button type="submit" disabled={enviando} className="h-auto min-h-10 max-w-[calc(100vw-7rem)] rounded-r-none px-5 py-2.5 text-left whitespace-normal">
            {enviando ? "Enviando..." : `Enviar como ${status}`}
          </Button>
          <Button type="button" disabled={enviando} aria-label="Escolher status do chamado" aria-expanded={menuAberto} onClick={() => setMenuAberto((aberto) => !aberto)} className="h-auto min-h-10 rounded-l-none border-l border-primary-foreground/30 px-3" title="Escolher status do chamado">
            <ChevronUp className="h-4 w-4" />
          </Button>
          {menuAberto && (
            <div role="group" aria-label="Status de envio" className="absolute bottom-full right-0 z-20 mb-2 max-h-72 w-max max-w-[min(22rem,calc(100vw-3rem))] overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
              {statusDisponiveis.map((opcao) => (
                <Button key={opcao} type="button" variant="ghost" aria-pressed={status === opcao} onClick={() => { setStatus(opcao); setMenuAberto(false); setErro(""); }} className="h-auto min-h-9 w-full justify-start whitespace-normal text-left text-xs">
                  {opcao}
                </Button>
              ))}
            </div>
          )}
        </div>
      </form>
    </Shell>
  );
}
