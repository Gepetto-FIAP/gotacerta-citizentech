"use client";

import Link from "next/link";
import { useDadosApi } from "@/hooks/useDadosApi";
import { api } from "@/lib/api";
import { ESTILO_SEVERIDADE, INFO_ALERTA, litros, ordenarAlertas, porcento, reais, umaCasa } from "@/lib/formato";
import type { Dashboard } from "@/lib/types";
import { AvisoErro, Carregando, ErroTela } from "@/components/Estados";
import { ComImovel } from "@/components/ComImovel";
import { Mostrador, PonteiroLitros } from "@/components/Mostrador";
import { SeletorImovel } from "@/components/SeletorImovel";

/** O painel pergunta à API a cada 4 s: a vazão e os alertas mudam enquanto o simulador roda. */
const INTERVALO_PAINEL_MS = 4000;

/** Tarifa de exemplo usada pela API (TelemetriaService.TarifaPadraoPorM3). */
const TARIFA_EXEMPLO_M3 = 8.5;

export default function Painel() {
  return <ComImovel>{(imovel) => <ConteudoPainel imovelId={imovel.id} />}</ComImovel>;
}

function ConteudoPainel({ imovelId }: { imovelId: number }) {
  const { dados, carregando, erro, atualizadoEm, tentarDeNovo } = useDadosApi(
    `dashboard-${imovelId}`,
    () => api.dashboard(imovelId),
    INTERVALO_PAINEL_MS,
  );

  if (carregando && !dados) return <Carregando linhas={2} rotulo="Carregando o painel" />;
  if (!dados) return <ErroTela mensagem={erro ?? "Erro ao carregar o painel."} aoTentar={tentarDeNovo} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tinta md:text-3xl">{dados.apelidoLocal}</h1>
          <p className="text-sm text-suave">
            {dados.bairro}, hidrômetro {dados.numeroSerieHidrometro}
          </p>
        </div>
        <SeletorImovel />
      </div>

      {erro && <AvisoErro mensagem={erro} />}

      <AlertasDoImovel dados={dados} />

      <div className="grid gap-5 lg:grid-cols-12">
        <AguaAgora dados={dados} />
        <ConsumoDoMes dados={dados} />
      </div>

      {atualizadoEm && (
        <p className="text-xs text-suave">
          Atualizado às {atualizadoEm.toLocaleTimeString("pt-BR")}. A tela se atualiza sozinha a cada 4 segundos.
        </p>
      )}
    </div>
  );
}

function AlertasDoImovel({ dados }: { dados: Dashboard }) {
  if (dados.alertasAtivos.length === 0) {
    return (
      <p className="rounded-lg border border-musgo/25 bg-musgo-claro px-4 py-3 text-sm font-medium text-musgo-escuro">
        Tudo certo: nenhum alerta ativo neste imóvel.
      </p>
    );
  }

  const [principal] = ordenarAlertas(dados.alertasAtivos);
  const estilo = ESTILO_SEVERIDADE[principal.severidade];
  const outros = dados.alertasAtivos.length - 1;

  return (
    <section
      aria-label="Alerta ativo"
      className={`flex flex-col gap-3 rounded-lg border-l-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${estilo.borda} ${estilo.fundo}`}
    >
      <div>
        <p className="font-semibold text-texto">{INFO_ALERTA[principal.tipoAlerta].titulo}</p>
        <p className="mt-0.5 text-sm text-texto/80">{principal.mensagem}</p>
        {outros > 0 && (
          <p className="mt-1 text-sm text-suave">
            E mais {outros} {outros === 1 ? "alerta ativo" : "alertas ativos"}.
          </p>
        )}
      </div>
      <Link href="/alertas" className="btn-secundario shrink-0">
        Ver alertas
      </Link>
    </section>
  );
}

/** O destaque da tela: a vazão de agora, o ponteiro de litros girando e o mostrador do hidrômetro. */
function AguaAgora({ dados }: { dados: Dashboard }) {
  const passando = dados.vazaoAtualLpm > 0;
  return (
    <section aria-labelledby="titulo-agua" className="rounded-2xl bg-tinta p-5 text-white md:p-7 lg:col-span-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="titulo-agua" className="text-sm text-white/80">
            Água passando agora
          </h2>
          <p className="mt-1">
            <span className="numero text-5xl font-bold md:text-6xl">{umaCasa(dados.vazaoAtualLpm)}</span>
            <span className="ml-2 text-lg text-white/80">L/min</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-white/85">
            {passando
              ? "O ponteiro de litros está girando: cada volta é 1 litro."
              : "O ponteiro de litros está parado. Nenhuma água passando."}
          </p>
        </div>
        <PonteiroLitros vazaoLpm={dados.vazaoAtualLpm} />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-5">
        <div>
          <h3 className="mb-2 text-sm text-white/80">Leitura do mostrador</h3>
          <Mostrador litros={dados.leituraAtualMostradorLitros} />
        </div>
        <p className="max-w-52 text-xs text-white/70">
          Os números pretos são os metros cúbicos da conta; os vermelhos, os litros. Devem bater com o seu hidrômetro.
        </p>
      </div>
    </section>
  );
}

function ConsumoDoMes({ dados }: { dados: Dashboard }) {
  const pct = dados.percentualMetaConsumida;
  const corBarra = pct >= 100 ? "bg-ponteiro" : pct >= 80 ? "bg-latao" : "bg-musgo";
  const diferenca = dados.metaConsumoMensalLitros - dados.consumoMesLitros;

  // Projeção simples: média por dia até hoje × dias do mês ("no ritmo atual, o mês fecha em…").
  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const projecao = (dados.consumoMesLitros / hoje.getDate()) * diasNoMes;

  return (
    <section aria-labelledby="titulo-consumo" className="cartao flex flex-col lg:col-span-5">
      <h2 id="titulo-consumo" className="text-sm text-suave">
        Consumo do mês
      </h2>
      <p className="numero mt-1 text-4xl font-bold text-tinta">{litros(dados.consumoMesLitros)}</p>
      <p className="mt-1 text-sm text-texto">
        Cerca de <strong className="numero text-base">{reais(dados.valorEstimadoReais)}</strong> na conta
      </p>

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="text-texto">Meta de {litros(dados.metaConsumoMensalLitros)}</span>
          <span className="numero font-semibold text-texto">{porcento(pct)}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Meta do mês consumida"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-papel"
        >
          <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-texto">
          {diferenca >= 0
            ? `Faltam ${litros(diferenca)} para chegar na meta.`
            : `Você passou ${litros(-diferenca)} da meta.`}
          {dados.consumoMesLitros > 0 && ` No ritmo atual, o mês fecha em cerca de ${litros(projecao)}.`}
        </p>
      </div>

      <p className="mt-auto border-t border-linha pt-3 text-xs text-suave max-lg:mt-5">
        Valor estimado: litros ÷ 1.000 × tarifa de exemplo de {reais(TARIFA_EXEMPLO_M3)} por m³. A conta real pode variar.
      </p>
    </section>
  );
}
