"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAlertas } from "@/context/AlertasContext";
import { useAuth } from "@/context/AuthContext";
import { useImoveis } from "@/context/ImoveisContext";
import { useDadosApi } from "@/hooks/useDadosApi";
import { api } from "@/lib/api";
import { ESTILO_SEVERIDADE, INFO_ALERTA, ORDEM_SEVERIDADE, litros, ordenarAlertas } from "@/lib/formato";
import type { Alerta, ResumoBairro } from "@/lib/types";
import { AvisoErro, Carregando, ErroTela, Vazio } from "@/components/Estados";

const INTERVALO_GESTOR_MS = 10_000;

/** Visão do gestor da comunidade: alertas e consumo por bairro (GET /api/bairros/alertas). */
export default function PainelGestor() {
  const { ehGestor } = useAuth();

  if (!ehGestor) {
    return (
      <Vazio
        titulo="Área do gestor"
        texto="Esta tela mostra os alertas de todo o bairro e é exclusiva do perfil gestor."
      >
        <Link href="/painel" className="btn-primario">
          Voltar ao meu painel
        </Link>
      </Vazio>
    );
  }

  return <ConteudoGestor />;
}

function ConteudoGestor() {
  const { dados, carregando, erro, tentarDeNovo } = useDadosApi("bairros", api.resumoBairros, INTERVALO_GESTOR_MS);
  const { ativos } = useAlertas();
  const { imoveis } = useImoveis();

  const bairros = useMemo(
    () =>
      [...(dados ?? [])].sort(
        (a, b) => b.alertasAtivos - a.alertasAtivos || b.volumeDesperdicadoLitros - a.volumeDesperdicadoLitros,
      ),
    [dados],
  );

  // Agrupa os alertas ativos por imóvel para a lista "onde agir primeiro".
  const imoveisComAlerta = useMemo(() => {
    const porImovel = new Map<number, Alerta[]>();
    for (const a of ativos) porImovel.set(a.imovelId, [...(porImovel.get(a.imovelId) ?? []), a]);
    return Array.from(porImovel.entries())
      .map(([imovelId, lista]) => ({
        imovel: imoveis.find((i) => i.id === imovelId),
        maisGrave: ordenarAlertas(lista)[0],
        total: lista.length,
      }))
      .sort((a, b) => ORDEM_SEVERIDADE[a.maisGrave.severidade] - ORDEM_SEVERIDADE[b.maisGrave.severidade]);
  }, [ativos, imoveis]);

  if (carregando && !dados) return <Carregando rotulo="Carregando bairros" />;
  if (!dados) return <ErroTela mensagem={erro ?? "Erro ao carregar os bairros."} aoTentar={tentarDeNovo} />;

  const total = bairros.reduce(
    (soma, b) => ({
      imoveis: soma.imoveis + b.totalImoveisMonitorados,
      alertas: soma.alertas + b.alertasAtivos,
      desperdicio: soma.desperdicio + b.volumeDesperdicadoLitros,
    }),
    { imoveis: 0, alertas: 0, desperdicio: 0 },
  );
  const maxAlertas = Math.max(...bairros.map((b) => b.alertasAtivos), 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-tinta md:text-3xl">Visão do bairro</h1>
        <p className="text-sm text-suave">Alertas e consumo de todos os imóveis monitorados.</p>
      </div>

      {erro && <AvisoErro mensagem={erro} />}

      <dl className="grid grid-cols-3 gap-2 md:gap-4">
        <Numero rotulo="Imóveis monitorados" valor={String(total.imoveis)} />
        <Numero rotulo="Alertas ativos" valor={String(total.alertas)} destaque={total.alertas > 0} />
        <Numero rotulo="Desperdício estimado" valor={litros(total.desperdicio)} />
      </dl>

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <section className="cartao lg:col-span-5">
          <h2 className="font-semibold text-tinta">Onde agir primeiro</h2>
          {imoveisComAlerta.length === 0 ? (
            <p className="mt-2 text-sm text-suave">Nenhum imóvel com alerta ativo agora.</p>
          ) : (
            <ul className="mt-2 divide-y divide-linha">
              {imoveisComAlerta.map(({ imovel, maisGrave, total: qtd }) => (
                <li key={maisGrave.imovelId} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-texto">{imovel?.apelidoLocal ?? `Imóvel ${maisGrave.imovelId}`}</p>
                    <p className="text-xs text-suave">
                      {imovel?.bairro}: {INFO_ALERTA[maisGrave.tipoAlerta].titulo}
                      {qtd > 1 && ` (+${qtd - 1})`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_SEVERIDADE[maisGrave.severidade].selo}`}>
                    {ESTILO_SEVERIDADE[maisGrave.severidade].rotulo}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/alertas" className="btn-secundario mt-3 w-full">
            Abrir central de alertas
          </Link>
        </section>

        <section className="lg:col-span-7">
          <h2 className="mb-3 font-semibold text-tinta">Bairros, do mais crítico ao mais tranquilo</h2>
          {bairros.length === 0 ? (
            <Vazio titulo="Nenhum bairro com imóveis" />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {bairros.map((b) => (
                <li key={b.bairro}>
                  <CartaoBairro bairro={b} maxAlertas={maxAlertas} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function CartaoBairro({ bairro, maxAlertas }: { bairro: ResumoBairro; maxAlertas: number }) {
  return (
    <article className="cartao">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-tinta">{bairro.bairro}</h3>
        <span className="text-xs text-suave">
          {bairro.totalImoveisMonitorados} {bairro.totalImoveisMonitorados === 1 ? "imóvel" : "imóveis"}
        </span>
      </div>
      {bairro.alertasAtivos > 0 ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-papel" aria-hidden="true">
            <div className="h-full rounded-full bg-ponteiro" style={{ width: `${(bairro.alertasAtivos / maxAlertas) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold text-ponteiro">
            {bairro.alertasAtivos} {bairro.alertasAtivos === 1 ? "alerta ativo" : "alertas ativos"}
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold text-musgo-escuro">Sem alertas ativos</p>
      )}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-suave">Consumo total</dt>
          <dd className="font-medium tabular-nums text-texto">{litros(bairro.consumoTotalBairroLitros)}</dd>
        </div>
        <div>
          <dt className="text-xs text-suave">Desperdício estimado</dt>
          <dd className="font-medium tabular-nums text-texto">{litros(bairro.volumeDesperdicadoLitros)}</dd>
        </div>
      </dl>
    </article>
  );
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`cartao p-3 md:p-5 ${destaque ? "border-ponteiro/30 bg-ponteiro-claro" : ""}`}>
      <dt className="text-xs text-suave md:text-sm">{rotulo}</dt>
      <dd className={`numero mt-1 text-xl font-bold md:text-3xl ${destaque ? "text-ponteiro" : "text-tinta"}`}>{valor}</dd>
    </div>
  );
}
