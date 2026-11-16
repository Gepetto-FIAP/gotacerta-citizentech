// Regras iguais às do CreateImovelDto / UpdateImovelDto da API.
// Validar antes de enviar dá feedback na hora; a API valida de novo (400) por segurança.

export interface DadosImovelForm {
  apelidoLocal: string;
  endereco: string;
  bairro: string;
  cep: string;
  numeroSerieHidrometro: string;
  metaConsumoMensalLitros: string;
}

export type ErrosImovel = Partial<Record<keyof DadosImovelForm, string>>;

export function validarImovel(d: DadosImovelForm, completo: boolean): ErrosImovel {
  const erros: ErrosImovel = {};
  if (d.apelidoLocal.trim().length < 3) erros.apelidoLocal = "Use pelo menos 3 letras (ex.: Casa da Maria).";
  if (d.endereco.trim().length < 5) erros.endereco = "Digite o endereço com rua e número.";
  if (d.bairro.trim().length < 2) erros.bairro = "Digite o bairro.";

  const meta = Number(d.metaConsumoMensalLitros);
  if (!Number.isFinite(meta) || meta < 100 || meta > 10_000_000)
    erros.metaConsumoMensalLitros = "A meta deve ficar entre 100 e 10.000.000 litros.";

  if (completo) {
    if (!/^\d{5}-?\d{3}$/.test(d.cep.trim())) erros.cep = "CEP no formato 00000-000.";
    if (d.numeroSerieHidrometro.trim().length < 4)
      erros.numeroSerieHidrometro = "Digite o número de série que aparece no hidrômetro.";
  }
  return erros;
}

/** Formata o CEP enquanto a pessoa digita: 08090100 → 08090-100. */
export function mascaraCep(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}
