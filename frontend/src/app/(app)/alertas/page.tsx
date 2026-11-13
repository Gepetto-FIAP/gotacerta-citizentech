"use client";

import { useMemo, useState } from "react";
import { useAlertas } from "@/context/AlertasContext";
import { useAuth } from "@/context/AuthContext";
import { useImoveis } from "@/context/ImoveisContext";
import { useToast } from "@/context/ToastContext";
import { api, mensagemDeErro } from "@/lib/api";
import { INFO_ALERTA, ordenarAlertas } from "@/lib/formato";
import { CartaoAlerta } from "@/components/CartaoAlerta";
import { AvisoErro, Carregando, ErroTela, Vazio } from "@/components/Estados";

type Filtro = "ativos" | "resolvidos" | "todos";

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "resolvidos", rotulo: "Resolvidos" },
  { valor: "todos", rotulo: "Todos" },
];

export default function CentralDeAlertas() {
  const { alertas, carregando, erro, atualizadoEm, recarregar, tentarDeNovo } = useAlertas();
  const { imoveis } = useImoveis();
  const { ehGestor } = useAuth();
  const { mostrar } = useToast();

  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const nomeImovel = useMemo(() => new Map(imoveis.map((i) => [i.id, `${i.apelidoLocal}, ${i.bairro}`])), [imoveis]);

  const contagem: Record<Filtro, number> = {
    ativos: alertas.filter((a) => !a.resolvido).length,
    resolvidos: alertas.filter((a) => a.resolvido).length,
    todos: alertas.length,
  };

  const visiveis = useMemo(() => {
    const filtrados = alertas.filter((a) =>
      filtro === "ativos" ? !a.resolvido : filtro === "resolvidos" ? a.resolvido : true,
    );
    return ordenarAlertas(filtrados);
  }, [alertas, filtro]);

  // PUT /api/alertas/{id}: marca o alerta como resolvido (vazamento consertado ou aviso de meta visto).
  async function confirmarReparo(id: number) {
    const alerta = alertas.find((a) => a.id === id);
    setConfirmandoId(id);
    try {
      await api.confirmarReparo(id);
      await recarregar();
      mostrar(alerta ? `${INFO_ALERTA[alerta.tipoAlerta].feito}.` : "Alerta resolvido.");
    } catch (e) {
      mostrar(mensagemDeErro(e), "erro");
    } finally {
      setConfirmandoId(null);
    }
  }

  const jaCarregou = atualizadoEm !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tinta md:text-3xl">Central de alertas</h1>
          <p className="text-sm text-suave">
            {ehGestor ? "Alertas de todos os imóveis monitorados." : "Avisos de vazamento e de consumo dos seus imóveis."}
          </p>
        </div>

        <div role="group" aria-label="Filtrar alertas" className="grid grid-cols-3 gap-1 rounded-lg bg-linha/60 p-1 md:w-96">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              aria-pressed={filtro === f.valor}
              className={`min-h-11 rounded-md text-sm font-semibold ${
                filtro === f.valor ? "bg-white text-tinta shadow-sm" : "text-suave hover:text-tinta"
              }`}
            >
              {f.rotulo} <span className="numero font-normal">({contagem[f.valor]})</span>
            </button>
          ))}
        </div>
      </div>

      {erro && jaCarregou && <AvisoErro mensagem={erro} />}

      {!jaCarregou && erro ? (
        <ErroTela mensagem={erro} aoTentar={tentarDeNovo} />
      ) : !jaCarregou && carregando ? (
        <Carregando rotulo="Carregando alertas" />
      ) : visiveis.length === 0 ? (
        <Vazio
          titulo={filtro === "ativos" ? "Nenhum alerta ativo" : "Nenhum alerta por aqui"}
          texto={
            filtro === "ativos"
              ? "Se aparecer água passando sem parar de madrugada ou um pico de vazão, o aviso chega aqui na hora."
              : undefined
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visiveis.map((a) => (
            <li key={a.id}>
              <CartaoAlerta
                alerta={a}
                imovel={ehGestor || imoveis.length > 1 ? nomeImovel.get(a.imovelId) : undefined}
                aoConfirmarReparo={confirmarReparo}
                confirmando={confirmandoId === a.id}
              />
            </li>
          ))}
        </ul>
      )}

      {jaCarregou && <p className="text-xs text-suave">A lista se atualiza sozinha a cada 4 segundos.</p>}
    </div>
  );
}
