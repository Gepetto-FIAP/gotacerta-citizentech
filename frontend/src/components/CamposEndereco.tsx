import { Campo } from "./Campo";
import type { ErrosEndereco, useEnderecoPorCep } from "@/hooks/useEnderecoPorCep";

type Endereco = ReturnType<typeof useEnderecoPorCep>;


/** Grupo de campos de endereço: CEP primeiro; rua, bairro e cidade vêm do CEP e ficam travados. */
export function CamposEndereco({ endereco, erros }: { endereco: Endereco; erros: ErrosEndereco }) {
  const { valores, situacao, travados, numeroRef, alterarCep, alterar } = endereco;
  // Antes de saber o CEP, rua/bairro/cidade ficam travados e vazios: o CEP é o primeiro passo.
  const aguardandoCep = situacao === "vazio" || situacao === "buscando";

  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-base font-semibold text-tinta">Endereço</legend>

      <div>
        <div className="sm:w-56">
          <Campo
            rotulo="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={valores.cep}
            onChange={alterarCep}
            erro={erros.cep}
          />
        </div>
        {!erros.cep && <StatusCep situacao={situacao} />}
      </div>

      <Campo
        rotulo="Rua"
        autoComplete="address-line1"
        value={valores.rua}
        onChange={alterar("rua")}
        travado={aguardandoCep || travados.rua}
        erro={erros.rua}
      />

      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Campo
          ref={numeroRef}
          rotulo="Número"
          inputMode="text"
          value={valores.numero}
          onChange={alterar("numero")}
          erro={erros.numero}
        />
        <Campo
          rotulo="Complemento (opcional)"
          placeholder="Casa 2, apto 31"
          value={valores.complemento}
          onChange={alterar("complemento")}
          erro={erros.complemento}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem]">
        <Campo
          rotulo="Bairro"
          value={valores.bairro}
          onChange={alterar("bairro")}
          travado={aguardandoCep || travados.bairro}
          erro={erros.bairro}
        />
        <Campo
          rotulo="Cidade"
          autoComplete="address-level2"
          value={valores.cidade}
          onChange={alterar("cidade")}
          travado={aguardandoCep || travados.cidade}
          erro={erros.cidade}
        />
        <Campo
          rotulo="UF"
          autoComplete="address-level1"
          value={valores.uf}
          onChange={alterar("uf")}
          travado={aguardandoCep || travados.cidade}
          erro={erros.uf}
        />
      </div>
    </fieldset>
  );
}

const MENSAGEM: Record<Endereco["situacao"], { texto: string; cor: string }> = {
  vazio: { texto: "Digite o CEP para preencher o endereço.", cor: "text-suave" },
  buscando: { texto: "Buscando endereço…", cor: "text-suave" },
  encontrado: { texto: "Endereço encontrado. Rua, bairro e cidade vêm do CEP; falta só o número.", cor: "text-musgo-escuro" },
  nao_encontrado: { texto: "CEP não encontrado. Confira os números ou preencha o endereço abaixo.", cor: "text-latao-escuro" },
  indisponivel: { texto: "Não foi possível consultar o CEP agora. Preencha o endereço abaixo.", cor: "text-latao-escuro" },
};

function StatusCep({ situacao }: { situacao: Endereco["situacao"] }) {
  const msg = MENSAGEM[situacao];
  return (
    <p aria-live="polite" className={`mt-1 min-h-4 text-xs ${msg.cor}`}>
      {msg.texto}
    </p>
  );
}
