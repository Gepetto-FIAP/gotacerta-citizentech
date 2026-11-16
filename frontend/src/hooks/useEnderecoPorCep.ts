"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FalhaCep, buscarCep } from "@/lib/cep";
import { mascaraCep } from "@/lib/validacao";

export type SituacaoCep = "vazio" | "buscando" | "encontrado" | "nao_encontrado" | "indisponivel";

export interface CamposEndereco {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type ErrosEndereco = Partial<Record<keyof CamposEndereco, string>>;

const VAZIO: CamposEndereco = { cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };
const SEM_TRAVA = { rua: false, bairro: false, cidade: false };

/**
 * Endereço preenchido pelo CEP, como na maioria dos cadastros:
 * 1. a pessoa digita o CEP; ao completar 8 dígitos, buscamos no ViaCEP;
 * 2. rua, bairro e cidade/UF são preenchidos e travados (só leitura);
 * 3. o cursor vai para o número, que junto com o complemento é a única parte digitada.
 * Se o CEP não existir ou o ViaCEP estiver fora do ar, os campos destravam para preencher à mão.
 */
export function useEnderecoPorCep() {
  const [valores, setValores] = useState<CamposEndereco>(VAZIO);
  const [situacao, setSituacao] = useState<SituacaoCep>("vazio");
  // Só trava o que veio preenchido: em cidades de CEP único o ViaCEP não traz rua nem bairro.
  const [travados, setTravados] = useState(SEM_TRAVA);
  const buscaAtual = useRef<AbortController | null>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const cepAtual = useRef("");

  useEffect(() => () => buscaAtual.current?.abort(), []);

  const pesquisar = useCallback(async (cep: string) => {
    buscaAtual.current?.abort();
    const controle = new AbortController();
    buscaAtual.current = controle;
    setSituacao("buscando");

    try {
      const achado = await buscarCep(cep, controle.signal);
      if (controle.signal.aborted) return;
      setValores((v) => ({ ...v, rua: achado.logradouro, bairro: achado.bairro, cidade: achado.cidade, uf: achado.uf }));
      setTravados({ rua: !!achado.logradouro, bairro: !!achado.bairro, cidade: !!achado.cidade });
      setSituacao("encontrado");
      numeroRef.current?.focus();
    } catch (erro) {
      if (controle.signal.aborted) return;
      setTravados(SEM_TRAVA);
      setSituacao(erro instanceof FalhaCep ? erro.motivo : "indisponivel");
    }
  }, []);

  const alterarCep = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cep = mascaraCep(e.target.value);
      // Dígito a mais num CEP já completo: a máscara ignora e não há nada para buscar de novo.
      if (cep === cepAtual.current) return;
      cepAtual.current = cep;
      // Mudou o CEP: o endereço anterior não vale mais.
      setValores((v) => ({ ...v, cep, rua: "", bairro: "", cidade: "", uf: "" }));
      setTravados(SEM_TRAVA);
      if (cep.replace(/\D/g, "").length === 8) void pesquisar(cep);
      else {
        buscaAtual.current?.abort();
        setSituacao("vazio");
      }
    },
    [pesquisar],
  );

  const alterar = useCallback(
    (campo: Exclude<keyof CamposEndereco, "cep">) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValores((v) => ({ ...v, [campo]: campo === "uf" ? e.target.value.toUpperCase().slice(0, 2) : e.target.value })),
    [],
  );

  /** Mesmo formato para qualquer imóvel: "Rua das Acácias, 142 - Casa 2 - São Paulo/SP". */
  const enderecoCompleto = [
    `${valores.rua.trim()}, ${valores.numero.trim()}`,
    valores.complemento.trim(),
    valores.cidade.trim() && `${valores.cidade.trim()}/${valores.uf.trim()}`,
  ]
    .filter(Boolean)
    .join(" - ");

  function validar(): ErrosEndereco {
    const erros: ErrosEndereco = {};
    if (valores.cep.replace(/\D/g, "").length !== 8) erros.cep = "Digite os 8 números do CEP.";
    else if (situacao === "buscando") erros.cep = "Aguarde: ainda estamos buscando o endereço.";
    if (valores.rua.trim().length < 3) erros.rua = "Digite o nome da rua.";
    if (!valores.numero.trim()) erros.numero = "Digite o número (ou S/N se não tiver).";
    if (valores.bairro.trim().length < 2) erros.bairro = "Digite o bairro.";
    if (valores.cidade.trim().length < 2) erros.cidade = "Digite a cidade.";
    if (!/^[A-Za-z]{2}$/.test(valores.uf.trim())) erros.uf = "UF com 2 letras.";
    if (enderecoCompleto.length > 200) erros.complemento = "Endereço muito longo. Encurte o complemento.";
    return erros;
  }

  return { valores, situacao, travados, numeroRef, alterarCep, alterar, enderecoCompleto, validar };
}
