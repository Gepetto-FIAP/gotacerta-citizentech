import { useState } from "react";
import { Icone } from "./Icone";

interface Props {
  rotulo: string;
  pergunta: string;
  aoConfirmar: () => void | Promise<void>;
  ocupado?: boolean;
  className?: string;
}

/** Botão de ação destrutiva (remover) que pede confirmação antes, sem abrir janela do navegador. */
export function BotaoConfirmar({ rotulo, pergunta, aoConfirmar, ocupado, className = "" }: Props) {
  const [perguntando, setPerguntando] = useState(false);

  if (!perguntando) {
    return (
      <button type="button" onClick={() => setPerguntando(true)} className={`btn-perigo ${className}`}>
        <Icone nome="lixeira" className="h-4 w-4" />
        {rotulo}
      </button>
    );
  }

  return (
    <div role="group" aria-label={pergunta} className={`rounded-xl bg-ponteiro-claro p-3 ring-1 ring-ponteiro/25 ${className}`}>
      <p className="text-sm font-medium text-ponteiro">{pergunta}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setPerguntando(false)} disabled={ocupado} className="btn-secundario">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void aoConfirmar()}
          disabled={ocupado}
          className="btn-primario bg-ponteiro hover:bg-ponteiro/90"
        >
          {ocupado ? "Removendo…" : "Sim, remover"}
        </button>
      </div>
    </div>
  );
}
