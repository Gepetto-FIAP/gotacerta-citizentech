"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useImoveis } from "@/context/ImoveisContext";
import { useToast } from "@/context/ToastContext";
import { api, mensagemDeErro } from "@/lib/api";
import { validarImovel, type DadosImovelForm, type ErrosImovel } from "@/lib/validacao";
import { useEnderecoPorCep, type ErrosEndereco } from "@/hooks/useEnderecoPorCep";
import { Campo } from "@/components/Campo";
import { Icone } from "@/components/Icone";
import { CamposEndereco } from "@/components/CamposEndereco";

const VAZIO: DadosImovelForm = {
  apelidoLocal: "",
  endereco: "",
  bairro: "",
  cep: "",
  numeroSerieHidrometro: "",
  metaConsumoMensalLitros: "10000",
};

/** Cadastro de imóvel + hidrômetro (POST /api/imoveis) e, se informado, do sensor (POST /api/sensores). */
export default function NovoImovel() {
  const { sessao } = useAuth();
  const { recarregar, selecionar } = useImoveis();
  const { mostrar } = useToast();
  const router = useRouter();

  const [dados, setDados] = useState(VAZIO);
  const endereco = useEnderecoPorCep();
  const [codigoSensor, setCodigoSensor] = useState("");
  const [erros, setErros] = useState<ErrosImovel & { codigoSensor?: string }>({});
  const [errosEndereco, setErrosEndereco] = useState<ErrosEndereco>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo: keyof DadosImovelForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!sessao) return;
    // Endereço é validado campo a campo pelo hook; aqui ficam apelido, hidrômetro e meta.
    const { valores } = endereco;
    const errosEnd = endereco.validar();
    const { endereco: _e, bairro: _b, cep: _c, ...novos }: typeof erros = validarImovel(
      { ...dados, endereco: endereco.enderecoCompleto, bairro: valores.bairro, cep: valores.cep },
      true,
    );
    if (codigoSensor && codigoSensor.trim().length < 3) novos.codigoSensor = "O código tem pelo menos 3 caracteres.";
    setErros(novos);
    setErrosEndereco(errosEnd);
    setErroGeral(null);
    if (Object.keys(novos).length > 0 || Object.keys(errosEnd).length > 0) return;

    setEnviando(true);
    try {
      const criado = await api.criarImovel({
        usuarioId: sessao.usuarioId,
        apelidoLocal: dados.apelidoLocal.trim(),
        endereco: endereco.enderecoCompleto,
        bairro: valores.bairro.trim(),
        cep: valores.cep,
        numeroSerieHidrometro: dados.numeroSerieHidrometro.trim(),
        metaConsumoMensalLitros: Number(dados.metaConsumoMensalLitros),
      });

      // O módulo óptico tem 2 sensores: o fototransistor (que conta os pulsos) e o LED infravermelho.
      if (codigoSensor.trim()) {
        const codigo = codigoSensor.trim().toUpperCase();
        try {
          await api.criarSensor({
            imovelId: criado.id,
            codigoDispositivo: codigo,
            tipoSensor: "FOTOTRANSISTOR",
            fatorCalibracaoPulsosLitro: 1,
            limiteVazaoAlertaLpm: 25,
          });
          await api.criarSensor({
            imovelId: criado.id,
            codigoDispositivo: `${codigo}-IR`,
            tipoSensor: "LED_IR",
            fatorCalibracaoPulsosLitro: 1,
            limiteVazaoAlertaLpm: 25,
          });
        } catch (erroSensor) {
          mostrar(`Imóvel salvo, mas o sensor não: ${mensagemDeErro(erroSensor)}`, "erro");
        }
      }

      await recarregar();
      selecionar(criado.id);
      mostrar("Imóvel cadastrado com sucesso!");
      router.push("/painel");
    } catch (erro) {
      setErroGeral(mensagemDeErro(erro));
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/imoveis" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-agua-escuro hover:underline">
          <Icone nome="voltar" className="h-4 w-4" />
          Meus imóveis
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tinta md:text-3xl">Cadastrar imóvel</h1>
        <p className="text-sm text-suave">Dados do local e do hidrômetro que vai receber o sensor.</p>
      </div>

      <form onSubmit={enviar} noValidate className="cartao max-w-2xl space-y-4">
        {erroGeral && (
          <p role="alert" className="rounded-xl bg-ponteiro-claro px-3 py-2 text-sm font-medium text-ponteiro ring-1 ring-ponteiro/25">
            {erroGeral}
          </p>
        )}
        <Campo rotulo="Apelido do local" placeholder="Ex.: Casa da Dona Maria" value={dados.apelidoLocal} onChange={alterar("apelidoLocal")} erro={erros.apelidoLocal} />

        <CamposEndereco endereco={endereco} erros={errosEndereco} />

        <hr className="border-linha" />
        <Campo
          rotulo="Nº de série do hidrômetro"
          placeholder="Ex.: HIDRO-2026-900"
          dica="Fica gravado na tampa ou no corpo do hidrômetro."
          value={dados.numeroSerieHidrometro}
          onChange={alterar("numeroSerieHidrometro")}
          erro={erros.numeroSerieHidrometro}
        />
        <Campo
          rotulo="Meta de consumo do mês (litros)"
          type="number"
          inputMode="numeric"
          min={100}
          step={100}
          dica="Uma casa de 3 pessoas costuma gastar cerca de 10.000 L por mês."
          value={dados.metaConsumoMensalLitros}
          onChange={alterar("metaConsumoMensalLitros")}
          erro={erros.metaConsumoMensalLitros}
        />
        <Campo
          rotulo="Código do sensor Gota Certa (opcional)"
          placeholder="Ex.: GC-005"
          dica="Está na etiqueta do dispositivo. Pode ser cadastrado depois."
          value={codigoSensor}
          onChange={(e) => setCodigoSensor(e.target.value)}
          erro={erros.codigoSensor}
        />
        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? "Salvando…" : "Salvar imóvel"}
        </button>
      </form>
    </div>
  );
}
