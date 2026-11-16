"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError, mensagemDeErro } from "@/lib/api";
import { Campo } from "@/components/Campo";
import { CampoSenha } from "@/components/CampoSenha";
import { TelaAcesso } from "@/components/TelaAcesso";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Erros {
  nome?: string;
  email?: string;
  senha?: string;
  confirmacao?: string;
}

/** Cadastro de morador. O perfil ADMIN (gestor) não é escolhido aqui: quem cria é a equipe. */
export default function Cadastro() {
  const { cadastrar } = useAuth();
  const { mostrar } = useToast();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    // Mesmas regras do RegisterUsuarioDto da API, para o usuário saber o erro antes de enviar.
    const novos: Erros = {};
    if (nome.trim().length < 3) novos.nome = "Digite seu nome (mínimo 3 letras).";
    if (!EMAIL_VALIDO.test(email.trim())) novos.email = "Digite um e-mail válido.";
    if (senha.length < 6) novos.senha = "Use pelo menos 6 caracteres.";
    if (confirmacao !== senha) novos.confirmacao = "As senhas não são iguais.";
    setErros(novos);
    setErroGeral(null);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      await cadastrar(nome.trim(), email.trim(), senha);
      mostrar("Conta criada! Agora cadastre seu imóvel.");
      router.replace("/imoveis/novo");
    } catch (erro) {
      setErroGeral(
        erro instanceof ApiError && erro.status === 409
          ? "Já existe uma conta com este e-mail. Tente entrar."
          : mensagemDeErro(erro),
      );
      setEnviando(false);
    }
  }

  return (
    <TelaAcesso titulo="Criar conta">
      <p className="mt-1 text-sm text-suave">Leva menos de um minuto.</p>

      <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
        {erroGeral && (
          <p role="alert" className="rounded-xl bg-ponteiro-claro px-3 py-2 text-sm font-medium text-ponteiro ring-1 ring-ponteiro/25">
            {erroGeral}
          </p>
        )}
        <Campo rotulo="Nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
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
          autoComplete="new-password"
          dica="Mínimo de 6 caracteres."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />
        <CampoSenha
          rotulo="Confirme a senha"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          erro={erros.confirmacao}
        />
        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-suave">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-agua-escuro underline-offset-2 hover:underline">
          Entrar
        </Link>
      </p>
    </TelaAcesso>
  );
}
