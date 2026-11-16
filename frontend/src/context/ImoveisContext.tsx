"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useDadosApi } from "@/hooks/useDadosApi";
import { api } from "@/lib/api";
import type { Imovel } from "@/lib/types";

interface ImoveisValor {
  imoveis: Imovel[];
  carregando: boolean;
  /** true depois da primeira resposta da API (com sucesso). */
  prontos: boolean;
  erro: string | null;
  selecionado: Imovel | null;
  selecionar: (id: number) => void;
  recarregar: () => Promise<void>;
  tentarDeNovo: () => Promise<void>;
}

const ImoveisContext = createContext<ImoveisValor | null>(null);
const CHAVE_SELECIONADO = "gotacerta.imovelSelecionado";

/**
 * Lista de imóveis do usuário logado e qual deles está selecionado no Painel e no Histórico.
 * Morador busca só os próprios (filtro usuarioId); o gestor (ADMIN) vê todos.
 */
export function ImoveisProvider({ children }: { children: React.ReactNode }) {
  const { sessao, ehGestor } = useAuth();
  const usuarioId = sessao?.usuarioId;

  const { dados, carregando, erro, recarregar, tentarDeNovo } = useDadosApi(
    usuarioId ? `imoveis-${usuarioId}` : null,
    () => api.listarImoveis(ehGestor ? {} : { usuarioId }),
  );

  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const salvo = Number(localStorage.getItem(CHAVE_SELECIONADO));
      if (salvo) setSelecionadoId(salvo);
    } catch {
      // sem localStorage: começa pelo primeiro imóvel
    }
  }, []);

  const selecionar = useCallback((id: number) => {
    setSelecionadoId(id);
    try {
      localStorage.setItem(CHAVE_SELECIONADO, String(id));
    } catch {
      // ignora
    }
  }, []);

  const valor = useMemo<ImoveisValor>(() => {
    const imoveis = dados ?? [];
    // Se o imóvel salvo não existe mais (foi removido ou é de outro usuário), usa o primeiro.
    const selecionado = imoveis.find((i) => i.id === selecionadoId) ?? imoveis[0] ?? null;
    return {
      imoveis,
      carregando,
      prontos: dados !== null,
      erro,
      selecionado,
      selecionar,
      recarregar,
      tentarDeNovo,
    };
  }, [dados, carregando, erro, selecionadoId, selecionar, recarregar, tentarDeNovo]);

  return <ImoveisContext.Provider value={valor}>{children}</ImoveisContext.Provider>;
}

export function useImoveis() {
  const ctx = useContext(ImoveisContext);
  if (!ctx) throw new Error("useImoveis precisa estar dentro de <ImoveisProvider>");
  return ctx;
}
