import type { Severidade, TipoAlerta } from "./types";

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const litros = (valor: number) => `${numero.format(valor)} L`;
export const vazao = (valor: number) => `${decimal.format(valor)} L/min`;
export const umaCasa = (valor: number) => decimal.format(valor);
export const reais = (valor: number) => moeda.format(valor);
export const porcento = (valor: number) => `${numero.format(valor)}%`;

/**
 * A API grava a data dos alertas com DateTime.UtcNow, mas o SQLite devolve sem o "Z" no final
 * (ex.: "2026-11-13T02:02:53"). Sem o Z, o navegador acharia que é horário local e mostraria
 * 3 horas a mais. Aqui marcamos como UTC quando não vier fuso.
 */
export function dataUtc(iso: string) {
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(temFuso ? iso : `${iso}Z`);
}

export function dataHora(iso: string) {
  return dataUtc(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-11-15" → "15/11". Monta a data por partes para não cair no fuso UTC. */
export function diaMes(dataIso: string) {
  const [, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}`;
}

/**
 * Textos dos 3 gatilhos da página 9 do guia, em linguagem de morador.
 * `acao` é o texto do botão que chama PUT /api/alertas/{id}: vazamento se conserta, meta só se marca como vista.
 */
export const INFO_ALERTA: Record<
  TipoAlerta,
  { titulo: string; dica: string; acao: string; feito: string }
> = {
  VAZAMENTO_OCULTO_MADRUGADA: {
    titulo: "Possível vazamento oculto",
    dica: "Teste: feche todas as torneiras. Se a estrela do hidrômetro continuar girando, há vazamento.",
    acao: "Confirmar reparo",
    feito: "Reparo confirmado",
  },
  CANO_ROMPIDO_PICO: {
    titulo: "Vazão muito alta: cano rompido?",
    dica: "A água está passando acima do limite do imóvel. Feche o registro e verifique.",
    acao: "Confirmar reparo",
    feito: "Reparo confirmado",
  },
  META_MENSAL_ULTRAPASSADA: {
    titulo: "Você passou da meta do mês",
    dica: "Veja no histórico os dias de maior gasto.",
    acao: "Marcar como visto",
    feito: "Marcado como visto",
  },
};

/** Cores e rótulos por severidade (CRITICA > MEDIA > BAIXA). */
// Vermelho do ponteiro = crítico, latão do corpo do hidrômetro = médio, água = baixo.
export const ESTILO_SEVERIDADE: Record<Severidade, { rotulo: string; selo: string; borda: string; fundo: string }> = {
  CRITICA: { rotulo: "Crítica", selo: "bg-ponteiro text-white", borda: "border-l-ponteiro", fundo: "bg-ponteiro-claro" },
  MEDIA: { rotulo: "Média", selo: "bg-latao-claro text-latao-escuro", borda: "border-l-latao", fundo: "bg-latao-claro" },
  BAIXA: { rotulo: "Baixa", selo: "bg-agua-claro text-agua-escuro", borda: "border-l-agua", fundo: "bg-agua-claro" },
};

export const ORDEM_SEVERIDADE: Record<Severidade, number> = { CRITICA: 0, MEDIA: 1, BAIXA: 2 };

/** Ordena alertas: mais graves primeiro e, dentro da mesma gravidade, os mais recentes. */
export function ordenarAlertas<T extends { severidade: Severidade; dataGeracao: string }>(lista: T[]) {
  return [...lista].sort(
    (a, b) =>
      ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade] ||
      dataUtc(b.dataGeracao).getTime() - dataUtc(a.dataGeracao).getTime(),
  );
}
