// Busca de endereço pelo CEP no ViaCEP (https://viacep.com.br), serviço público e gratuito.
// A chamada vai direto do navegador para o ViaCEP, sem passar pela nossa API e sem o token JWT.

export interface EnderecoCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type ErroCep = "nao_encontrado" | "indisponivel";

export class FalhaCep extends Error {
  constructor(public motivo: ErroCep) {
    super(motivo);
    this.name = "FalhaCep";
  }
}

const TEMPO_LIMITE_MS = 6000;

/** Recebe o CEP com ou sem hífen. Lança FalhaCep se não existir ou se o ViaCEP não responder. */
export async function buscarCep(cep: string, sinal?: AbortSignal): Promise<EnderecoCep> {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) throw new FalhaCep("nao_encontrado");

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  // Se o usuário digitar outro CEP no meio da busca, a busca antiga é cancelada.
  sinal?.addEventListener("abort", () => controle.abort());

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controle.signal });
    if (res.status === 400) throw new FalhaCep("nao_encontrado");
    if (!res.ok) throw new FalhaCep("indisponivel");

    const dados = await res.json();
    // CEP com formato certo mas inexistente: o ViaCEP responde 200 com { "erro": "true" }.
    if (dados.erro) throw new FalhaCep("nao_encontrado");

    return {
      logradouro: dados.logradouro ?? "",
      bairro: dados.bairro ?? "",
      cidade: dados.localidade ?? "",
      uf: dados.uf ?? "",
    };
  } catch (erro) {
    if (erro instanceof FalhaCep) throw erro;
    if (sinal?.aborted) throw erro; // cancelada de propósito: quem chamou ignora
    throw new FalhaCep("indisponivel");
  } finally {
    clearTimeout(timer);
  }
}
