import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { chamadosQuery, leiturasQuery } from "@/lib/chamados";

function iconeComContador(qtd: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 38px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(qtd > 99 ? "99+" : String(qtd), 32, 35);
  return canvas.toDataURL("image/png");
}

/** Faz o título e o ícone da aba piscarem com a quantidade de chamados novos ainda sem tratativa. */
export function useAlertaAba() {
  const { data: chamados = [] } = useQuery({ ...chamadosQuery, refetchInterval: 15000 });
  const { data: leituras } = useQuery(leiturasQuery);

  // Só chamados que ainda não tiveram a primeira tratativa (status NOVO CHAMADO) e que não foram criados por mim.
  const naoVistos = leituras ? chamados.filter((c) => c.status === "NOVO CHAMADO" && c.solicitanteId !== leituras.usuarioId).length : 0;

  useEffect(() => {
    if (naoVistos === 0) return;
    const tituloOriginal = document.title.replace(/^\(\d+\+?\)\s*/, "");
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const iconeOriginal = link?.href;
    const iconeAlerta = iconeComContador(naoVistos);
    const textoAlerta = `(${naoVistos}) ${naoVistos === 1 ? "Novo chamado" : "Novos chamados"}`;
    let aceso = false;
    const piscar = () => {
      aceso = !aceso;
      document.title = aceso ? textoAlerta : tituloOriginal;
      if (link && iconeAlerta && iconeOriginal) link.href = aceso ? iconeAlerta : iconeOriginal;
    };
    piscar();
    const id = window.setInterval(piscar, 1000);
    return () => {
      window.clearInterval(id);
      document.title = tituloOriginal;
      if (link && iconeOriginal) link.href = iconeOriginal;
    };
  }, [naoVistos]);

  return naoVistos;
}
