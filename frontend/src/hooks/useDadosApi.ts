"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mensagemDeErro } from "@/lib/api";

interface Estado<T> {
  dados: T | null;
  erro: string | null;
  carregando: boolean;
  atualizadoEm: Date | null;
}

interface OpcoesCarga {
  /** Não mostra o "carregando" (usado no polling e depois de salvar algo). */
  silencioso?: boolean;
  /** Se já tem uma busca em andamento, não começa outra (evita empilhar requisições no polling). */
  pularSeOcupado?: boolean;
}

/**
 * Busca dados da API e controla os estados de carregando / erro / sucesso.
 *
 * - `chave`: identifica o que está sendo buscado (ex.: "dashboard-3"). Quando muda, busca de novo.
 *   Se for null, não busca nada (ex.: nenhum imóvel selecionado ainda).
 * - `intervaloMs`: se informado, repete a busca nesse intervalo (polling). É assim que um alerta
 *   novo do simulador aparece na tela sem o usuário recarregar a página.
 */
export function useDadosApi<T>(chave: string | null, buscar: () => Promise<T>, intervaloMs?: number) {
  const [estado, setEstado] = useState<Estado<T>>({
    dados: null,
    erro: null,
    carregando: chave !== null,
    atualizadoEm: null,
  });

  // Guardamos a função numa ref para usar sempre a versão mais nova sem reiniciar o polling.
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  const versao = useRef(0);
  const ocupado = useRef(false);

  const carregar = useCallback(async ({ silencioso = false, pularSeOcupado = false }: OpcoesCarga = {}) => {
    if (pularSeOcupado && ocupado.current) return;
    const minhaVersao = ++versao.current;
    ocupado.current = true;
    if (!silencioso) setEstado((s) => ({ ...s, carregando: true, erro: null }));

    try {
      const dados = await buscarRef.current();
      // Uma resposta antiga (de outra chave) que chegou atrasada é descartada.
      if (minhaVersao !== versao.current) return;
      setEstado({ dados, erro: null, carregando: false, atualizadoEm: new Date() });
    } catch (erro) {
      if (minhaVersao !== versao.current) return;
      // Mantém os últimos dados na tela e só mostra o aviso de erro.
      setEstado((s) => ({ ...s, erro: mensagemDeErro(erro), carregando: false }));
    } finally {
      if (minhaVersao === versao.current) ocupado.current = false;
    }
  }, []);

  useEffect(() => {
    if (chave === null) {
      versao.current++;
      setEstado({ dados: null, erro: null, carregando: false, atualizadoEm: null });
      return;
    }

    setEstado({ dados: null, erro: null, carregando: true, atualizadoEm: null });
    void carregar();

    if (!intervaloMs) return;
    const id = setInterval(() => {
      // Aba escondida não precisa ficar consultando a API.
      if (document.visibilityState === "visible") void carregar({ silencioso: true, pularSeOcupado: true });
    }, intervaloMs);
    return () => clearInterval(id);
  }, [chave, intervaloMs, carregar]);

  const recarregar = useCallback(() => carregar({ silencioso: true }), [carregar]);
  const tentarDeNovo = useCallback(() => carregar(), [carregar]);

  return { ...estado, recarregar, tentarDeNovo };
}
