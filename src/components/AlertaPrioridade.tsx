import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { chamadosQuery, formatNumero, getMyRole, STATUS_PRIO_ENTREGA, STATUS_PRIO_FINALIZADA } from "@/lib/chamados";

function tocarAviso() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
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
    setTimeout(() => void ctx.close(), 1200);
  } catch { /* navegador sem áudio */ }
}

/** Lojinha é avisada de "Prioridade de entrega"; SAC é avisado de "Prioridade finalizada". */
export function AlertaPrioridade() {
  const { data: role } = useQuery({ queryKey: ["my-role"], queryFn: getMyRole });
  const alvo = role === "lojinha" ? STATUS_PRIO_ENTREGA : role === "sac" ? STATUS_PRIO_FINALIZADA : null;
  const { data: list } = useQuery({ ...chamadosQuery, refetchInterval: 15000, enabled: !!alvo });
  const vistos = useRef<Set<number> | null>(null);
  const [aviso, setAviso] = useState<number[]>([]);

  useEffect(() => {
    if (!alvo || !list) return;
    const atuais = new Set(list.filter((c) => c.status === alvo).map((c) => c.numero));
    if (vistos.current) {
      const novos = [...atuais].filter((n) => !vistos.current!.has(n));
      if (novos.length) { tocarAviso(); setAviso(novos); }
    }
    vistos.current = atuais;
  }, [list, alvo]);

  if (!aviso.length || !alvo) return null;
  return (
    <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-primary bg-background p-4 shadow-lg">
      <p className="text-sm font-semibold">Novo chamado em "{alvo}"</p>
      <p className="mt-1 text-sm text-muted-foreground">{aviso.map(formatNumero).join(", ")}</p>
      <button onClick={() => setAviso([])} className="mt-2 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">OK</button>
    </div>
  );
}
