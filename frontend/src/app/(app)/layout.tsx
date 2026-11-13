"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ImoveisProvider } from "@/context/ImoveisContext";
import { AlertasProvider } from "@/context/AlertasContext";
import { Icone } from "@/components/Icone";
import { Marca, NavegacaoInferior, NavegacaoLateral } from "@/components/Navegacao";
import { TelaCarregando } from "@/components/TelaCarregando";

/**
 * Layout de todas as telas que exigem login (pasta "(app)").
 * Sem sessão, manda para /login. Mobile-first: no celular, barra no topo e navegação embaixo;
 * a partir de 768 px (md), menu lateral e conteúdo mais largo.
 */
export default function AreaLogadaLayout({ children }: { children: React.ReactNode }) {
  const { sessao, pronto, ehGestor, sair } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (pronto && !sessao) router.replace("/login");
  }, [pronto, sessao, router]);

  if (!pronto || !sessao) return <TelaCarregando />;

  const perfil = ehGestor ? "Gestor da comunidade" : "Morador";

  return (
    <ImoveisProvider>
      <AlertasProvider>
        <div className="md:flex">
          <NavegacaoLateral nome={sessao.nome} perfil={perfil} aoSair={sair} />

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-linha bg-white/95 px-4 py-3 backdrop-blur md:hidden">
              <Marca />
              <button
                onClick={sair}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-suave hover:bg-papel hover:text-tinta"
              >
                <Icone nome="sair" className="h-5 w-5" />
                Sair
              </button>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>
          </div>
        </div>

        <NavegacaoInferior />
      </AlertasProvider>
    </ImoveisProvider>
  );
}
