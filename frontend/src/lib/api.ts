import { lerSessao } from "./sessao";
import type {
  Alerta,
  ConsumoDiario,
  Dashboard,
  Imovel,
  ImovelEditavel,
  NovoImovel,
  NovoSensor,
  ResumoBairro,
  Sensor,
  Sessao,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const TEMPO_LIMITE_MS = 10_000;

/**
 * Erro padronizado de todas as chamadas.
 * status = 0 significa que nem chegamos na API (servidor fora do ar, sem rede ou tempo esgotado).
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get semConexao() {
    return this.status === 0;
  }
}

// O AuthContext registra aqui o que fazer quando o token for recusado (401): sair e voltar ao login.
let aoSessaoExpirar: (() => void) | null = null;
export function definirAoSessaoExpirar(fn: (() => void) | null) {
  aoSessaoExpirar = fn;
}

const MENSAGENS_POR_STATUS: Record<number, string> = {
  400: "Dados inválidos. Confira os campos e tente de novo.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Seu perfil não tem permissão para esta ação.",
  404: "Registro não encontrado.",
  409: "Esse registro já existe.",
};

/** Lê a mensagem de erro que a API devolve: { erro } ou o ValidationProblemDetails do ASP.NET. */
async function extrairMensagem(res: Response): Promise<string | null> {
  try {
    const corpo = await res.json();
    if (typeof corpo?.erro === "string") return corpo.erro;
    if (corpo?.errors && typeof corpo.errors === "object") {
      const mensagens = Object.values(corpo.errors as Record<string, string[]>).flat();
      if (mensagens.length > 0) return mensagens.join(" ");
    }
    if (typeof corpo?.title === "string") return corpo.title;
  } catch {
    // corpo vazio ou não-JSON
  }
  return null;
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (corpo !== undefined) headers["Content-Type"] = "application/json";

  // Todas as chamadas levam o token JWT no header Authorization (padrão Bearer).
  const token = lerSessao()?.tokenJwt;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch (erro) {
    const tempoEsgotado = erro instanceof DOMException && erro.name === "AbortError";
    throw new ApiError(
      0,
      tempoEsgotado
        ? "A API demorou demais para responder. Tente de novo em instantes."
        : "Sem conexão com a API. Verifique sua internet ou se o servidor está no ar.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // 401 numa rota protegida = token vencido ou inválido. No login, 401 é só senha errada.
    if (res.status === 401 && token && !caminho.startsWith("/api/auth")) {
      aoSessaoExpirar?.();
    }
    const mensagem = (await extrairMensagem(res)) ?? MENSAGENS_POR_STATUS[res.status];
    throw new ApiError(res.status, mensagem ?? `Erro inesperado na API (HTTP ${res.status}).`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined) busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}

// Uma função por endpoint da página 14 do guia.
export const api = {
  login: (email: string, senha: string) =>
    requisicao<Sessao>("POST", "/api/auth/login", { email, senha }),

  cadastrarUsuario: (nome: string, email: string, senha: string) =>
    requisicao<Sessao>("POST", "/api/auth/register", { nome, email, senha, perfil: "MORADOR" }),

  listarImoveis: (filtro: { usuarioId?: number; bairro?: string } = {}) =>
    requisicao<Imovel[]>("GET", `/api/imoveis${query(filtro)}`),

  criarImovel: (dados: NovoImovel) => requisicao<Imovel>("POST", "/api/imoveis", dados),

  atualizarImovel: (id: number, dados: ImovelEditavel) =>
    requisicao<Imovel>("PUT", `/api/imoveis/${id}`, dados),

  removerImovel: (id: number) => requisicao<void>("DELETE", `/api/imoveis/${id}`),

  dashboard: (imovelId: number) =>
    requisicao<Dashboard>("GET", `/api/imoveis/${imovelId}/dashboard`),

  historico: (imovelId: number) =>
    requisicao<ConsumoDiario[]>("GET", `/api/imoveis/${imovelId}/historico`),

  listarAlertas: (filtro: { apenasAtivos?: boolean; imovelId?: number } = {}) =>
    requisicao<Alerta[]>("GET", `/api/alertas${query(filtro)}`),

  confirmarReparo: (alertaId: number) => requisicao<Alerta>("PUT", `/api/alertas/${alertaId}`),

  criarSensor: (dados: NovoSensor) => requisicao<Sensor>("POST", "/api/sensores", dados),

  removerSensor: (id: number) => requisicao<void>("DELETE", `/api/sensores/${id}`),

  resumoBairros: () => requisicao<ResumoBairro[]>("GET", "/api/bairros/alertas"),
};

/** Converte qualquer erro em texto para mostrar na tela. */
export function mensagemDeErro(erro: unknown) {
  if (erro instanceof ApiError) return erro.message;
  return "Algo deu errado. Tente de novo.";
}
