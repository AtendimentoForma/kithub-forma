import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { Paperclip, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { MOTIVOS, addChamado, formatNumero } from "@/lib/chamados";

const input = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, name, type = "text", required = true, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}{required && " *"}
      <input name={name} type={type} required={required} placeholder={placeholder} maxLength={255} className={input} />
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
  const [anexos, setAnexos] = useState<File[]>([]);
  const anexosRef = useRef<HTMLInputElement>(null);

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
    if (motivos.includes("Outro") && !g("motivoOutro")) return setErro("Descreva o motivo \"Outro\".");
    const nomesAnexos = anexos.map((x) => x.name);
    setErro("");
    setEnviando(true);
    try {
      const c = await addChamado({
        paxNome: g("paxNome"), cpf: g("cpf"), paxId: g("paxId"), idDelivery: g("idDelivery"), responsavel: g("responsavel"),
        rastreio: g("rastreio"), endereco: g("endereco"), dataEnvio: g("dataEnvio"),
        motivos, motivoOutro: g("motivoOutro") || null, origemSolicitacao: origens.join(", "),
        observacao: g("observacao") || null, anexos: nomesAnexos,
      });
      await qc.invalidateQueries({ queryKey: ["chamados"] });
      setCriado(c.numero);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  if (criado !== null)
    return (
      <Shell title="Chamado criado">
        <div className="rounded-xl border bg-background p-8 text-center">
          <div className="font-mono text-3xl font-bold">{formatNumero(criado)}</div>
          <p className="mt-2 text-muted-foreground">Status inicial: NOVO CHAMADO</p>
          <button onClick={() => navigate({ to: listaPath })} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ver chamados</button>
        </div>
      </Shell>
    );

  return (
    <Shell title="Novo chamado de reenvio">
      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 font-semibold">Origem da solicitação *</h2>
          <div className="flex flex-wrap gap-4">
            {["Cliente entrou em contato", "Identificado internamente"].map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={origens.includes(o)} onChange={() => toggleOrigem(o)} className="h-4 w-4 accent-primary" /> {o}
              </label>
            ))}
          </div>
        </section>
        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 font-semibold">Dados do passageiro</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" name="paxNome" />
            <Field label="CPF" name="cpf" placeholder="000.000.000-00" />
            <Field label="ID do Pax" name="paxId" />
            <Field label="ID Delivery" name="idDelivery" />
            <Field label="Nome do responsável" name="responsavel" />
          </div>
        </section>
        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 font-semibold">Dados do envio original</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nº rastreio Mandaê" name="rastreio" />
            <Field label="Data do envio" name="dataEnvio" type="date" />
            <div className="sm:col-span-2"><Field label="Endereço utilizado" name="endereco" /></div>
          </div>
        </section>
        <section className="rounded-xl border bg-background p-6">
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
        <section className="rounded-xl border bg-background p-6">
          <h2 className="mb-4 font-semibold">Informações adicionais (opcional)</h2>
          <label className="block text-sm font-medium">Observação / descrição
            <textarea name="observacao" rows={4} maxLength={1000} className={input} />
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
                    <button
                      type="button"
                      onClick={() => removerAnexo(i)}
                      aria-label={`Remover ${f.name}`}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
        <button type="submit" disabled={enviando} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{enviando ? "Enviando..." : "Enviar chamado"}</button>
      </form>
    </Shell>
  );
}
