import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { buscarPedidoDelivery, verificarChamadosDelivery } from "@/lib/delivery.functions";
import { DELIVERY_DEBOUNCE_MS, validarIdDelivery, type AvisoDelivery, type SucessoDelivery } from "@/lib/delivery-mapping";
import { mascararCep } from "@/lib/endereco";
import { formatNumero } from "@/lib/chamados";

export const mascararCpfDelivery = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
export function useDeliveryLookup(enabled: boolean, setTipoEnvio: (v: string) => void) {
  const buscar = useServerFn(buscarPedidoDelivery);
  const verificar = useServerFn(verificarChamadosDelivery);
  const formRef = useRef<HTMLFormElement>(null);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoId = useRef("");
  const idAtual = useRef("");
  const revisao = useRef(0);
  const duplicateRevision = useRef(0);
  const [mensagem, setMensagem] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [avisos, setAvisos] = useState<AvisoDelivery[]>([]);
  const [selos, setSelos] = useState<Record<string, string>>({});
  const selosRef = useRef<Record<string, string>>({});
  const [sugestoes, setSugestoes] = useState<SucessoDelivery["sugestoes"]>({});
  const [duplicados, setDuplicados] = useState<{ paxNumero?: number; deliveryNumero?: number }>({});
  const [erroDuplicados, setErroDuplicados] = useState("");
  const elemento = (nome: string) => {
    const e = formRef.current?.elements.namedItem(nome);
    return e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement ? e : null;
  };
  const salvarSelos = (s: Record<string, string>) => { selosRef.current = s; setSelos(s); };
  const removerSelo = (nome: string) => {
    if (!(nome in selosRef.current)) return;
    const s = { ...selosRef.current }; delete s[nome]; salvarSelos(s);
  };
  async function checarDuplicados(id = idAtual.current, pax = elemento("paxId")?.value ?? "") {
    if (!enabled) return;
    const versao = ++duplicateRevision.current;
    try {
      const r = await verificar({ data: { idDelivery: id, paxId: pax } });
      if (versao === duplicateRevision.current) { setDuplicados(r); setErroDuplicados(""); }
    } catch {
      if (versao === duplicateRevision.current) setErroDuplicados("Não foi possível verificar chamados existentes. A validação será repetida ao enviar.");
    }
  }
  const iniciar = useRef<(id: string) => void>(() => {});
  iniciar.current = async (id: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!enabled || !validarIdDelivery(id) || ultimoId.current === id) return;
    ultimoId.current = id;
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    const versao = revisao.current;
    setBuscando(true); setMensagem("");
    void checarDuplicados(id);
    try {
      const r = await buscar({ data: { idDelivery: id }, signal: ctrl.signal });
      if (ctrl.signal.aborted || versao !== revisao.current || idAtual.current !== id) return;
      if (!r.ok) { setMensagem(r.mensagem); return; }
      const novos = { ...r.campos, ...r.campos.endereco } as Record<string, unknown>;
      delete novos.endereco;
      const s = { ...selosRef.current };
      // Clear only old auto-filled values that have not been manually edited.
      for (const [nome, valor] of Object.entries(s)) {
        if (!(nome in novos)) { const el = elemento(nome); if (el?.value === valor) el.value = ""; delete s[nome]; }
      }
      for (const [nome, v] of Object.entries(novos)) {
        if (typeof v !== "string" || nome === "idDelivery") continue;
        const el = elemento(nome);
        if (!el) continue;
        const valor = nome === "cpf" ? mascararCpfDelivery(v) : nome === "cep" ? mascararCep(v) : v;
        el.value = valor; s[nome] = valor;
      }
      salvarSelos(s); setAvisos(r.avisos); setSugestoes(r.sugestoes);
      setTipoEnvio(r.sugestoes.tipoEnvio ?? "");
      setMensagem("Dados carregados do Delivery");
      void checarDuplicados(id, r.campos.paxId ?? elemento("paxId")?.value ?? "");
    } catch (error) {
      if (ctrl.signal.aborted || versao !== revisao.current) return;
      setMensagem(error instanceof Error && error.message.includes("Sessão expirada") ? "Sessão expirada. Entre novamente." : "Delivery indisponível no momento. Preencha manualmente ou tente novamente.");
    } finally { if (!ctrl.signal.aborted && versao === revisao.current) setBuscando(false); }
  };
  const aoMudarId = (raw: string) => {
    if (!enabled) return;
    request.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    revisao.current++; duplicateRevision.current++;
    idAtual.current = raw; ultimoId.current = "";
    setBuscando(false); setMensagem(""); setAvisos([]); setSugestoes({}); setDuplicados({}); setErroDuplicados("");
    if (validarIdDelivery(raw)) timer.current = setTimeout(() => iniciar.current(raw), DELIVERY_DEBOUNCE_MS);
    else if (raw) setMensagem("Informe apenas números no ID Delivery.");
  };
  const buscarAgora = () => iniciar.current(idAtual.current);
  const aoEditar = (nome: string) => {
    removerSelo(nome);
    setAvisos(a => a.filter(v => v.campo !== nome));
    if (nome === "paxId") { duplicateRevision.current++; setDuplicados(d => ({ deliveryNumero: d.deliveryNumero })); }
  };
  useEffect(() => () => { request.current?.abort(); if (timer.current) clearTimeout(timer.current); }, []);
  const dicas = (nome: string) => [
    ...avisos.filter(a => a.campo === nome).map(a => a.mensagem),
    ...(nome === "paxId" && duplicados.paxNumero !== undefined ? [`Já existe o chamado ${formatNumero(duplicados.paxNumero)} em aberto para este ID do Pax. Conclua-o antes de abrir outro.`] : []),
    ...(nome === "idDelivery" && duplicados.deliveryNumero !== undefined ? [`Este ID Delivery já está no chamado ${formatNumero(duplicados.deliveryNumero)}.`] : []),
  ];
  return { formRef, buscando, mensagem, dicas, selos, sugestoes, aoMudarId, buscarAgora, aoEditar, checarDuplicados, erroDuplicados };
}