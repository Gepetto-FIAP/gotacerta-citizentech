import type { Sessao } from "./types";

// A sessão (dados do usuário + token JWT) fica no localStorage do navegador.
// Assim o login sobrevive a um recarregamento da página.
const CHAVE = "gotacerta.sessao";

export function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as Sessao;
    // Token vencido não serve mais: a API responderia 401.
    if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    // Navegador em modo privado pode bloquear o localStorage; o login vale só até recarregar.
  }
}

export function limparSessao() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada a fazer
  }
}
