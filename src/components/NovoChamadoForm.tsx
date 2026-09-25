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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    if (motivos.length === 0) return setErro("Selecione ao menos um motivo.");
    if (g("cpf").replace(/\D/g, "").length !== 11) return setErro("CPF deve ter 11 dígitos.");
    if (motivos.includes("Outro") && !g("motivoOutro")) return setErro("Descreva o motivo \"Outro\".");
    const nomesAnexos = anexos.map((x) => x.name);
    setErro("");
    setEnviando(true);
    try {
      const c = await addChamado({
        paxNome: g("paxNome"), cpf: g("cpf"), paxId: g("paxId"), responsavel: g("responsavel"),
        rastreio: g("rastreio"), endereco: g("endereco"), dataEnvio: g("dataEnvio"),
        motivos, motivoOutro: g("motivoOutro") || null, observacao: g("observacao") || null, anexos,
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
          <h2 className="mb-4 font-semibold">Dados do passageiro</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" name="paxNome" />
            <Field label="CPF" name="cpf" placeholder="000.000.000-00" />
            <Field label="ID do Pax" name="paxId" />
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
          <label className="mt-4 block text-sm font-medium">Anexar fotos / documentos
            <input name="anexos" type="file" multiple accept="image/*,.pdf" className="mt-1 block text-sm" />
          </label>
        </section>
        {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
        <button type="submit" disabled={enviando} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{enviando ? "Enviando..." : "Enviar chamado"}</button>
      </form>
    </Shell>
  );
}
