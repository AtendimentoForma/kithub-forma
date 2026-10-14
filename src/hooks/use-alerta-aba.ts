import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { chamadoNaoVisto, chamadosQuery, leiturasQuery, ultimasMovimentacoesQuery } from "@/lib/chamados";

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

/** Faz o título e o ícone da aba piscarem com a quantidade de chamados com movimentação não vista. */
export function useAlertaAba() {
  const { data: chamados = [] } = useQuery(chamadosQuery);
  const { data: ultimas = {} } = useQuery(ultimasMovimentacoesQuery);
  const { data: leituras } = useQuery(leiturasQuery);

  const naoVistos = chamados.filter((c) => chamadoNaoVisto(c, ultimas[c.numero], leituras)).length;

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
