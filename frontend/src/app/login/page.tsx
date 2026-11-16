"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError, mensagemDeErro } from "@/lib/api";
import { Campo } from "@/components/Campo";
import { CampoSenha } from "@/components/CampoSenha";
import { TelaAcesso } from "@/components/TelaAcesso";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { sessao, pronto, entrar } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Já logado? Vai direto para o app.
  useEffect(() => {
    if (pronto && sessao) router.replace(sessao.perfil === "ADMIN" ? "/gestor" : "/painel");
  }, [pronto, sessao, router]);

  // Veio redirecionado porque o token venceu (/login?expirou=1).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("expirou")) {
      setErroGeral("Sua sessão expirou. Entre novamente.");
    }
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const novosErros: typeof erros = {};
    if (!EMAIL_VALIDO.test(email.trim())) novosErros.email = "Digite um e-mail válido.";
    if (senha.length < 6) novosErros.senha = "A senha tem pelo menos 6 caracteres.";
    setErros(novosErros);
    setErroGeral(null);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    try {
      const nova = await entrar(email.trim(), senha);
      router.replace(nova.perfil === "ADMIN" ? "/gestor" : "/painel");
    } catch (erro) {
      setErroGeral(
        erro instanceof ApiError && erro.status === 401
          ? "E-mail ou senha incorretos."
          : mensagemDeErro(erro),
      );
      setEnviando(false);
    }
  }

  return (
    <TelaAcesso titulo="Entrar">
      <p className="mt-1 text-sm text-suave">Acompanhe o consumo e os alertas do seu hidrômetro.</p>

      <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
        {erroGeral && (
          <p role="alert" className="rounded-xl bg-ponteiro-claro px-3 py-2 text-sm font-medium text-ponteiro ring-1 ring-ponteiro/25">
            {erroGeral}
          </p>
        )}
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          erro={erros.email}
        />
        <CampoSenha
          rotulo="Senha"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />
        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-suave">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-agua-escuro underline-offset-2 hover:underline">
          Criar conta
        </Link>
      </p>
    </TelaAcesso>
  );
}
