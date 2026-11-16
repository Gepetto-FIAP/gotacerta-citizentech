"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, definirAoSessaoExpirar } from "@/lib/api";
import { lerSessao, limparSessao, salvarSessao } from "@/lib/sessao";
import type { Sessao } from "@/lib/types";

interface AuthValor {
  sessao: Sessao | null;
  /** false até lermos o localStorage; evita mandar para o login antes da hora. */
  pronto: boolean;
  ehGestor: boolean;
  entrar: (email: string, senha: string) => Promise<Sessao>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<Sessao>;
  sair: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setSessao(lerSessao());
    setPronto(true);
  }, []);

  const iniciar = useCallback((nova: Sessao) => {
    salvarSessao(nova);
    setSessao(nova);
    return nova;
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) => iniciar(await api.login(email, senha)),
    [iniciar],
  );

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string) =>
      iniciar(await api.cadastrarUsuario(nome, email, senha)),
    [iniciar],
  );

  const sair = useCallback(() => {
    limparSessao();
    setSessao(null);
    router.replace("/login");
  }, [router]);

  // Se a API recusar o token (401), a sessão acabou: limpa e volta para o login.
  useEffect(() => {
    definirAoSessaoExpirar(() => {
      limparSessao();
      setSessao(null);
      router.replace("/login?expirou=1");
    });
    return () => definirAoSessaoExpirar(null);
  }, [router]);

  const valor = useMemo(
    () => ({ sessao, pronto, ehGestor: sessao?.perfil === "ADMIN", entrar, cadastrar, sair }),
    [sessao, pronto, entrar, cadastrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
