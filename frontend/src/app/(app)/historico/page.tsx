"use client";

import { useDadosApi } from "@/hooks/useDadosApi";
import { api } from "@/lib/api";
import { diaMes, litros, vazao } from "@/lib/formato";
import type { ConsumoDiario, Imovel } from "@/lib/types";
import { AvisoErro, Carregando, ErroTela, Vazio } from "@/components/Estados";
import { ComImovel } from "@/components/ComImovel";
import { Icone } from "@/components/Icone";
import { SeletorImovel } from "@/components/SeletorImovel";

export default function Historico() {
  return <ComImovel>{(imovel) => <ConteudoHistorico imovel={imovel} />}</ComImovel>;
}

function ConteudoHistorico({ imovel }: { imovel: Imovel }) {
  const { dados, carregando, erro, recarregar, tentarDeNovo } = useDadosApi(`historico-${imovel.id}`, () =>
    api.historico(imovel.id),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tinta md:text-3xl">Histórico de consumo</h1>
          <p className="text-sm text-suave">Litros por dia em {imovel.apelidoLocal}</p>
        </div>
        <div className="flex items-end gap-2">
          <SeletorImovel />
          <button onClick={() => void recarregar()} className="btn-secundario px-3" aria-label="Atualizar histórico">
            <Icone nome="atualizar" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {erro && dados && <AvisoErro mensagem={erro} />}

      {carregando && !dados ? (
        <Carregando rotulo="Carregando histórico" />
      ) : !dados ? (
        <ErroTela mensagem={erro ?? "Erro ao carregar o histórico."} aoTentar={tentarDeNovo} />
      ) : dados.length === 0 ? (
        <Vazio titulo="Ainda sem leituras" texto="Quando o sensor enviar as primeiras leituras, o consumo de cada dia aparece aqui." />
      ) : (
        <Grafico dias={dados} metaMensal={imovel.metaConsumoMensalLitros} />
      )}
    </div>
  );
}

function Grafico({ dias, metaMensal }: { dias: ConsumoDiario[]; metaMensal: number }) {
  // Meta de referência por dia: meta do mês dividida por 30 dias.
  const metaDia = metaMensal / 30;
  const total = dias.reduce((soma, d) => soma + d.consumoDiaLitros, 0);
  const media = total / dias.length;
  const maiorDia = dias.reduce((maior, d) => (d.consumoDiaLitros > maior.consumoDiaLitros ? d : maior), dias[0]);
  // Escala das barras: o maior valor entre o dia mais alto e a meta diária ocupa 100%.
  const escala = Math.max(maiorDia.consumoDiaLitros, metaDia, 1);
  const posicaoMeta = (metaDia / escala) * 100;

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <section aria-labelledby="titulo-grafico" className="cartao lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-grafico" className="font-semibold text-tinta">
            Litros por dia
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-suave">
            <span className="inline-block h-3 w-0.5 bg-tinta" aria-hidden="true" />
            meta por dia: {litros(metaDia)}
          </span>
        </div>

        <ul className="mt-4 space-y-2.5">
          {dias.map((d) => {
            const acima = d.consumoDiaLitros > metaDia;
            const ehMaior = d.data === maiorDia.data;
            return (
              <li key={d.data} className="grid grid-cols-[3rem_1fr_5rem] items-center gap-3 text-sm">
                <span className={`numero ${ehMaior ? "font-bold text-tinta" : "text-suave"}`}>{diaMes(d.data)}</span>
                <div className="relative h-7 rounded bg-papel">
                  <div
                    className={`h-full rounded ${acima ? "bg-latao" : "bg-agua"}`}
                    style={{ width: `${Math.max((d.consumoDiaLitros / escala) * 100, 1)}%` }}
                  />
                  <span
                    className="absolute -inset-y-1 w-0.5 bg-tinta"
                    style={{ left: `${posicaoMeta}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="numero text-right text-texto">
                  {litros(d.consumoDiaLitros)}
                  <span className="sr-only">
                    {acima ? ", acima da meta diária" : ""}. Vazão máxima {vazao(d.vazaoMaximaDiaLpm)}.
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-suave">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-agua" aria-hidden="true" /> dentro da meta do dia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-latao" aria-hidden="true" /> acima da meta do dia
          </span>
        </p>
      </section>

      <aside aria-label="Resumo do período" className="space-y-4 lg:col-span-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-b border-linha pb-4 lg:grid-cols-1">
          <Resumo rotulo="Total no período" valor={litros(total)} />
          <Resumo rotulo="Média por dia" valor={litros(media)} />
        </dl>
        <div>
          <h2 className="text-sm text-suave">Dia de maior gasto</h2>
          <p className="numero mt-1 text-3xl font-bold text-tinta">{diaMes(maiorDia.data)}</p>
          <p className="mt-1 text-sm text-texto">
            {litros(maiorDia.consumoDiaLitros)}, com pico de {vazao(maiorDia.vazaoMaximaDiaLpm)}.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-suave">{rotulo}</dt>
      <dd className="numero mt-0.5 text-2xl font-bold text-tinta">{valor}</dd>
    </div>
  );
}
