"use client";

import { useImoveis } from "@/context/ImoveisContext";

/** Escolhe qual imóvel o Painel e o Histórico mostram. Só aparece com 2 ou mais imóveis. */
export function SeletorImovel() {
  const { imoveis, selecionado, selecionar } = useImoveis();
  if (imoveis.length < 2 || !selecionado) return null;

  return (
    <div className="md:w-72">
      <label htmlFor="seletor-imovel" className="text-sm font-medium text-suave">
        Imóvel
      </label>
      <select
        id="seletor-imovel"
        value={selecionado.id}
        onChange={(e) => selecionar(Number(e.target.value))}
        className="campo font-medium"
      >
        {imoveis.map((i) => (
          <option key={i.id} value={i.id}>
            {i.apelidoLocal}, {i.bairro}
          </option>
        ))}
      </select>
    </div>
  );
}
