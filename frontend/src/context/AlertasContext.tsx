"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useImoveis } from "./ImoveisContext";
import { useToast } from "./ToastContext";
import { useDadosApi } from "@/hooks/useDadosApi";
import { api } from "@/lib/api";
import { INFO_ALERTA } from "@/lib/formato";
import type { Alerta } from "@/lib/types";

/** De quanto em quanto tempo o app pergunta à API se surgiu alerta novo. */
export const INTERVALO_ALERTAS_MS = 4000;

interface AlertasValor {
  alertas: Alerta[];
  ativos: Alerta[];
  carregando: boolean;
  erro: string | null;
  atualizadoEm: Date | null;
  recarregar: () => Promise<void>;
  tentarDeNovo: () => Promise<void>;
}

const AlertasContext = createContext<AlertasValor | null>(null);

/**
 * Consulta GET /api/alertas a cada 4 segundos (polling), em qualquer tela do app.
 * Quando chega um alerta que ainda não conhecíamos, mostra um aviso na hora:
 * é assim que o vazamento simulado pelo Luiz aparece no celular sem recarregar.
 */
export function AlertasProvider({ children }: { children: React.ReactNode }) {
  const { sessao, ehGestor } = useAuth();
  const { imoveis, prontos: imoveisProntos } = useImoveis();
  const { mostrar } = useToast();

  const { dados, carregando, erro, atualizadoEm, recarregar, tentarDeNovo } = useDadosApi(
    sessao ? `alertas-${sessao.usuarioId}` : null,
    () => api.listarAlertas(),
    INTERVALO_ALERTAS_MS,
  );

  const alertas = useMemo(() => {
    if (!dados) return [];
    if (ehGestor) return dados;
    // Morador só vê alertas dos próprios imóveis.
    const meus = new Set(imoveis.map((i) => i.id));
    return dados.filter((a) => meus.has(a.imovelId));
  }, [dados, ehGestor, imoveis]);

  const ativos = useMemo(() => alertas.filter((a) => !a.resolvido), [alertas]);

  // Guarda os ids já vistos para saber quais alertas são novos.
  const conhecidos = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!dados || !imoveisProntos) return;
    if (conhecidos.current === null) {
      conhecidos.current = new Set(alertas.map((a) => a.id));
      return;
    }
    const vistos = conhecidos.current;
    const novos = ativos.filter((a) => !vistos.has(a.id));
    alertas.forEach((a) => vistos.add(a.id));
    if (novos.length === 1) mostrar(`Novo alerta: ${INFO_ALERTA[novos[0].tipoAlerta].titulo}`, "alerta");
    if (novos.length > 1) mostrar(`${novos.length} novos alertas. Abra a central de alertas.`, "alerta");
  }, [dados, imoveisProntos, alertas, ativos, mostrar]);

  const valor = useMemo(
    () => ({ alertas, ativos, carregando, erro, atualizadoEm, recarregar, tentarDeNovo }),
    [alertas, ativos, carregando, erro, atualizadoEm, recarregar, tentarDeNovo],
  );

  return <AlertasContext.Provider value={valor}>{children}</AlertasContext.Provider>;
}

export function useAlertas() {
  const ctx = useContext(AlertasContext);
  if (!ctx) throw new Error("useAlertas precisa estar dentro de <AlertasProvider>");
  return ctx;
}
