import { useState } from "react";
import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export type AnexoVisualizacao = { nome: string; tipo: string; url: string };
export function AnexoViewer({ anexo, onClose }: { anexo: AnexoVisualizacao; onClose: () => void }) {
  const [erro, setErro] = useState(false);
  return <div onClick={e => e.stopPropagation()}><Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent aria-describedby={undefined} onClick={e => e.stopPropagation()} className="z-[70] max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-4xl overflow-y-auto rounded-lg p-4 sm:p-6">
      <DialogTitle className="min-w-0 break-words pr-8">{anexo.nome}</DialogTitle>
      <div className="grid min-h-48 place-items-center overflow-hidden rounded-md bg-muted/40">
        {anexo.tipo.startsWith("image/") ? <img src={anexo.url} alt={anexo.nome} className="max-h-[65dvh] max-w-full object-contain" onError={() => setErro(true)} />
          : anexo.tipo.startsWith("video/") ? <video src={anexo.url} controls playsInline preload="metadata" className="max-h-[65dvh] w-full" onError={() => setErro(true)} />
          : anexo.tipo === "application/pdf" ? <iframe src={anexo.url} title={anexo.nome} className="h-[60dvh] w-full" />
          : <p className="p-4 text-sm text-muted-foreground">Pré-visualização indisponível para este formato.</p>}
        {erro && <p role="alert" className="p-4 text-sm text-destructive">Seu navegador não conseguiu visualizar este arquivo. Você pode baixá-lo abaixo.</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" asChild><a href={anexo.url} target="_blank" rel="noopener noreferrer" download={anexo.nome}><Download />Baixar arquivo</a></Button><Button onClick={onClose}><X />Fechar</Button></div>
    </DialogContent>
  </Dialog></div>;
}