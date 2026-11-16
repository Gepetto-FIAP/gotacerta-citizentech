"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useImoveis } from "@/context/ImoveisContext";
import { useToast } from "@/context/ToastContext";
import { ApiError, api, mensagemDeErro } from "@/lib/api";
import { litros } from "@/lib/formato";
import type { Imovel, Sensor } from "@/lib/types";
import { validarImovel, type DadosImovelForm, type ErrosImovel } from "@/lib/validacao";
import { BotaoConfirmar } from "@/components/BotaoConfirmar";
import { Campo } from "@/components/Campo";
import { AvisoErro, Carregando, ErroTela, Vazio } from "@/components/Estados";
import { Icone } from "@/components/Icone";

export default function MeusImoveis() {
  const { imoveis, prontos, erro, tentarDeNovo } = useImoveis();
  const { ehGestor } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tinta md:text-3xl">{ehGestor ? "Imóveis monitorados" : "Meus imóveis"}</h1>
          <p className="text-sm text-suave">Dados do hidrômetro, meta do mês e sensores.</p>
        </div>
        <Link href="/imoveis/novo" className="btn-primario shrink-0">
          <Icone nome="mais" className="h-4 w-4" />
          Cadastrar imóvel
        </Link>
      </div>

      {prontos && erro && <AvisoErro mensagem={erro} />}

      {!prontos && erro ? (
        <ErroTela mensagem={erro} aoTentar={tentarDeNovo} />
      ) : !prontos ? (
        <Carregando rotulo="Carregando imóveis" />
      ) : imoveis.length === 0 ? (
        <Vazio titulo="Nenhum imóvel cadastrado" texto="Cadastre o imóvel e o número do hidrômetro para começar.">
          <Link href="/imoveis/novo" className="btn-primario">
            Cadastrar imóvel
          </Link>
        </Vazio>
      ) : (
        <ul className="grid items-start gap-4 lg:grid-cols-2">
          {imoveis.map((imovel) => (
            <li key={imovel.id}>
              <CartaoImovel imovel={imovel} podeRemover={ehGestor} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CartaoImovel({ imovel, podeRemover }: { imovel: Imovel; podeRemover: boolean }) {
  const { recarregar } = useImoveis();
  const { mostrar } = useToast();
  const [editando, setEditando] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  // DELETE /api/imoveis/{id}: a API só aceita do perfil ADMIN (gestor).
  async function remover() {
    setRemovendo(true);
    try {
      await api.removerImovel(imovel.id);
      mostrar(`"${imovel.apelidoLocal}" foi removido.`);
      await recarregar();
    } catch (e) {
      mostrar(
        e instanceof ApiError && e.status === 403 ? "Só o gestor pode remover imóveis." : mensagemDeErro(e),
        "erro",
      );
      setRemovendo(false);
    }
  }

  const alertasAtivos = imovel.alertas.filter((a) => !a.resolvido).length;

  return (
    <article className="cartao space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-tinta">{imovel.apelidoLocal}</h2>
          <p className="text-sm text-suave">
            {imovel.endereco}, {imovel.bairro}, CEP {imovel.cep}
          </p>
        </div>
        {alertasAtivos > 0 && (
          <span className="shrink-0 rounded-full bg-ponteiro-claro px-2 py-0.5 text-xs font-semibold text-ponteiro">
            {alertasAtivos} {alertasAtivos === 1 ? "alerta" : "alertas"}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-papel p-2">
          <dt className="text-xs text-suave">Hidrômetro</dt>
          <dd className="font-medium break-all text-texto">{imovel.numeroSerieHidrometro}</dd>
        </div>
        <div className="rounded-xl bg-papel p-2">
          <dt className="text-xs text-suave">Meta do mês</dt>
          <dd className="font-medium text-texto">{litros(imovel.metaConsumoMensalLitros)}</dd>
        </div>
      </dl>

      {editando ? (
        <FormEdicao imovel={imovel} aoTerminar={() => setEditando(false)} />
      ) : (
        <button onClick={() => setEditando(true)} className="btn-secundario w-full">
          <Icone nome="lapis" className="h-4 w-4" />
          Editar dados e meta
        </button>
      )}

      <Sensores imovel={imovel} />

      {podeRemover && (
        <BotaoConfirmar
          rotulo="Remover imóvel"
          pergunta={`Remover "${imovel.apelidoLocal}" e todo o histórico dele?`}
          aoConfirmar={remover}
          ocupado={removendo}
          className="w-full"
        />
      )}
    </article>
  );
}

/** PUT /api/imoveis/{id}: altera apelido, endereço, bairro e a meta mensal. */
function FormEdicao({ imovel, aoTerminar }: { imovel: Imovel; aoTerminar: () => void }) {
  const { recarregar } = useImoveis();
  const { mostrar } = useToast();
  const [dados, setDados] = useState<DadosImovelForm>({
    apelidoLocal: imovel.apelidoLocal,
    endereco: imovel.endereco,
    bairro: imovel.bairro,
    cep: imovel.cep,
    numeroSerieHidrometro: imovel.numeroSerieHidrometro,
    metaConsumoMensalLitros: String(imovel.metaConsumoMensalLitros),
  });
  const [erros, setErros] = useState<ErrosImovel>({});
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo: keyof DadosImovelForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const novos = validarImovel(dados, false);
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setSalvando(true);
    try {
      await api.atualizarImovel(imovel.id, {
        apelidoLocal: dados.apelidoLocal.trim(),
        endereco: dados.endereco.trim(),
        bairro: dados.bairro.trim(),
        metaConsumoMensalLitros: Number(dados.metaConsumoMensalLitros),
      });
      await recarregar();
      mostrar("Dados do imóvel atualizados.");
      aoTerminar();
    } catch (erro) {
      mostrar(mensagemDeErro(erro), "erro");
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-3 rounded-xl bg-papel p-3">
      <Campo rotulo="Apelido do local" value={dados.apelidoLocal} onChange={alterar("apelidoLocal")} erro={erros.apelidoLocal} />
      {/* O endereço vem do CEP no cadastro e a API não permite trocar o CEP: aqui ele só aparece. */}
      <Campo rotulo="Endereço" value={dados.endereco} travado erro={erros.endereco} />
      <Campo
        rotulo="Bairro"
        value={dados.bairro}
        travado
        dica={`Endereço do CEP ${imovel.cep}. Para mudar, cadastre o imóvel de novo.`}
        erro={erros.bairro}
      />
      <Campo
        rotulo="Meta do mês (litros)"
        type="number"
        inputMode="numeric"
        min={100}
        step={100}
        value={dados.metaConsumoMensalLitros}
        onChange={alterar("metaConsumoMensalLitros")}
        erro={erros.metaConsumoMensalLitros}
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={aoTerminar} disabled={salvando} className="btn-secundario">
          Cancelar
        </button>
        <button type="submit" disabled={salvando} className="btn-primario">
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

const NOME_SENSOR: Record<Sensor["tipoSensor"], string> = {
  FOTOTRANSISTOR: "Fototransistor (conta os pulsos)",
  LED_IR: "LED infravermelho (ilumina o ponteiro)",
};

/** Sensores do imóvel: listar, cadastrar (POST /api/sensores) e remover (DELETE /api/sensores/{id}). */
function Sensores({ imovel }: { imovel: Imovel }) {
  const { recarregar } = useImoveis();
  const { mostrar } = useToast();
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<Sensor["tipoSensor"]>("FOTOTRANSISTOR");
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function remover(sensor: Sensor) {
    setRemovendoId(sensor.id);
    try {
      await api.removerSensor(sensor.id);
      await recarregar();
      mostrar(`Sensor ${sensor.codigoDispositivo} removido.`);
    } catch (e) {
      mostrar(mensagemDeErro(e), "erro");
    } finally {
      setRemovendoId(null);
    }
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.trim().length < 3) {
      setErroCodigo("Digite o código da etiqueta (ex.: GC-005).");
      return;
    }
    setErroCodigo(null);
    setSalvando(true);
    try {
      await api.criarSensor({
        imovelId: imovel.id,
        codigoDispositivo: codigo.trim().toUpperCase(),
        tipoSensor: tipo,
        fatorCalibracaoPulsosLitro: 1,
        limiteVazaoAlertaLpm: 25,
      });
      setCodigo("");
      await recarregar();
      mostrar("Sensor cadastrado.");
    } catch (erro) {
      mostrar(mensagemDeErro(erro), "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <details className="group rounded-xl ring-1 ring-linha">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-texto">
        Sensores ({imovel.sensores.length})
        <span className="text-suave transition-transform group-open:rotate-90" aria-hidden="true">
          ›
        </span>
      </summary>
      <div className="space-y-3 border-t border-linha p-3">
        {imovel.sensores.length === 0 ? (
          <p className="text-sm text-suave">Nenhum sensor ainda. Cadastre o código da etiqueta do dispositivo.</p>
        ) : (
          <ul className="space-y-2">
            {imovel.sensores.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-papel p-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-texto">{s.codigoDispositivo}</p>
                  <p className="text-xs text-suave">
                    {NOME_SENSOR[s.tipoSensor]}, alerta acima de {s.limiteVazaoAlertaLpm} L/min
                  </p>
                </div>
                <button
                  onClick={() => void remover(s)}
                  disabled={removendoId === s.id}
                  aria-label={`Remover sensor ${s.codigoDispositivo}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ponteiro hover:bg-ponteiro-claro disabled:opacity-50"
                >
                  <Icone nome="lixeira" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={adicionar} noValidate className="space-y-2">
          <Campo rotulo="Código do sensor" placeholder="GC-005" value={codigo} onChange={(e) => setCodigo(e.target.value)} erro={erroCodigo} />
          <div>
            <label htmlFor={`tipo-${imovel.id}`} className="text-sm font-medium text-texto">
              Tipo
            </label>
            <select
              id={`tipo-${imovel.id}`}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Sensor["tipoSensor"])}
              className="campo"
            >
              <option value="FOTOTRANSISTOR">{NOME_SENSOR.FOTOTRANSISTOR}</option>
              <option value="LED_IR">{NOME_SENSOR.LED_IR}</option>
            </select>
          </div>
          <button type="submit" disabled={salvando} className="btn-secundario w-full">
            <Icone nome="mais" className="h-4 w-4" />
            {salvando ? "Cadastrando…" : "Adicionar sensor"}
          </button>
        </form>
      </div>
    </details>
  );
}
