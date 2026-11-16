import Link from "next/link";
import { useImoveis } from "@/context/ImoveisContext";
import { Carregando, ErroTela, Vazio } from "./Estados";
import type { Imovel } from "@/lib/types";

/**
 * Painel e Histórico dependem de um imóvel selecionado.
 * Este componente cuida dos casos "carregando", "erro" e "nenhum imóvel" e só renderiza
 * o conteúdo (children) quando existe um imóvel.
 */
export function ComImovel({ children }: { children: (imovel: Imovel) => React.ReactNode }) {
  const { selecionado, prontos, erro, tentarDeNovo } = useImoveis();

  if (!prontos && erro) return <ErroTela mensagem={erro} aoTentar={tentarDeNovo} />;
  if (!prontos) return <Carregando />;
  if (!selecionado)
    return (
      <Vazio titulo="Nenhum imóvel cadastrado" texto="Cadastre o imóvel e o hidrômetro para começar a acompanhar o consumo.">
        <Link href="/imoveis/novo" className="btn-primario">
          Cadastrar imóvel
        </Link>
      </Vazio>
    );

  return <>{children(selecionado)}</>;
}
