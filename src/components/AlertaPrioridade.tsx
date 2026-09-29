import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { chamadosQuery, formatNumero, getMyRole, STATUS_PRIO_ENTREGA, STATUS_PRIO_FINALIZADA } from "@/lib/chamados";

const TITULO_ALERTA = "● 𝗡𝗢𝗩𝗔 𝗣𝗥𝗜𝗢𝗥𝗜𝗗𝗔𝗗𝗘 — KitHub";

let audioCtx: AudioContext | null = null;
function obterCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function tocarAviso() {
  try {
    const ctx = obterCtx();
    void ctx.resume();
    [0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* navegador sem áudio */ }
}

function notificarSistema(titulo: string, corpo: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(titulo, { body: corpo, tag: "kithub-prioridade" });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { /* ignore */ }
}

/** Lojinha é avisada de "Prioridade de entrega"; SAC é avisado de "Prioridade finalizada". */
export function AlertaPrioridade() {
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const alvo = role === "lojinha" ? STATUS_PRIO_ENTREGA : role === "sac" ? STATUS_PRIO_FINALIZADA : null;
  const { data: list } = useQuery({
    ...chamadosQuery,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    enabled: !!alvo,
  });
  const vistos = useRef<Set<number> | null>(null);
  const tituloOriginal = useRef<string | null>(null);
  const [aviso, setAviso] = useState<number[]>([]);

  const limparDestaqueDaAba = () => {
    if (tituloOriginal.current !== null) {
      document.title = tituloOriginal.current;
      tituloOriginal.current = null;
    }
  };

  const destacarAba = () => {
    if (tituloOriginal.current === null) tituloOriginal.current = document.title;
    document.title = TITULO_ALERTA;
  };

  // Libera o áudio e pede permissão de notificação na primeira interação do usuário.
  useEffect(() => {
    if (!alvo) return;
    const liberar = () => {
      try { void obterCtx().resume(); } catch { /* ignore */ }
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    };
    window.addEventListener("pointerdown", liberar);
    window.addEventListener("keydown", liberar);
    return () => {
      window.removeEventListener("pointerdown", liberar);
      window.removeEventListener("keydown", liberar);
    };
  }, [alvo]);

  // Mantém a aba sinalizada enquanto o usuário estiver em outra aba ou janela.
  useEffect(() => {
    const aoRetornar = () => {
      if (document.visibilityState === "visible") limparDestaqueDaAba();
    };
    document.addEventListener("visibilitychange", aoRetornar);
    window.addEventListener("focus", aoRetornar);
    return () => {
      document.removeEventListener("visibilitychange", aoRetornar);
      window.removeEventListener("focus", aoRetornar);
      limparDestaqueDaAba();
    };
  }, []);

  useEffect(() => {
    if (!alvo || !list) return;
    const atuais = new Set(list.filter((c) => c.status === alvo).map((c) => c.numero));
    if (vistos.current) {
      const novos = [...atuais].filter((n) => !vistos.current!.has(n));
      if (novos.length) {
        tocarAviso();
        setAviso(novos);
        destacarAba();
        notificarSistema(`KitHub — ${alvo}`, `Chamado ${novos.map(formatNumero).join(", ")}`);
      }
    }
    vistos.current = atuais;
  }, [list, alvo]);

  if (!aviso.length || !alvo) return null;
  return (
    <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-primary bg-background p-4 shadow-lg">
      <p className="text-sm font-semibold">Novo chamado em "{alvo}"</p>
      <p className="mt-1 text-sm text-muted-foreground">{aviso.map(formatNumero).join(", ")}</p>
      <button onClick={() => { setAviso([]); limparDestaqueDaAba(); }} className="mt-2 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">OK</button>
    </div>
  );
}
