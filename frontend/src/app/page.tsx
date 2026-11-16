"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TelaCarregando } from "@/components/TelaCarregando";

/** Rota "/": manda para o login ou para a tela inicial do perfil. */
export default function Inicio() {
  const { sessao, pronto, ehGestor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!pronto) return;
    if (!sessao) router.replace("/login");
    else router.replace(ehGestor ? "/gestor" : "/painel");
  }, [pronto, sessao, ehGestor, router]);

  return <TelaCarregando />;
}
