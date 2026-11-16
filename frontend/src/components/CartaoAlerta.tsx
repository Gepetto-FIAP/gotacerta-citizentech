import { Icone } from "./Icone";
import { ESTILO_SEVERIDADE, INFO_ALERTA, dataHora, litros } from "@/lib/formato";
import type { Alerta } from "@/lib/types";

interface Props {
  alerta: Pick<Alerta, "id" | "tipoAlerta" | "severidade" | "mensagem" | "desperdicioEstimadoLitros" | "dataGeracao"> & {
    resolvido?: boolean;
  };
  /** Nome do imóvel (mostrado para o gestor, que vê alertas de vários imóveis). */
  imovel?: string;
  aoConfirmarReparo?: (id: number) => void;
  confirmando?: boolean;
}

export function CartaoAlerta({ alerta, imovel, aoConfirmarReparo, confirmando }: Props) {
  const estilo = ESTILO_SEVERIDADE[alerta.severidade];
  const info = INFO_ALERTA[alerta.tipoAlerta];

  return (
    <article
      className={`flex h-full flex-col rounded-xl border border-l-4 border-linha bg-white p-4 md:p-5 ${
        alerta.resolvido ? "border-l-musgo" : estilo.borda
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estilo.selo}`}>
          Severidade {estilo.rotulo.toLowerCase()}
        </span>
        <time dateTime={alerta.dataGeracao} className="text-xs text-suave">
          {dataHora(alerta.dataGeracao)}
        </time>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-tinta">{info.titulo}</h3>
      {imovel && <p className="text-sm text-suave">{imovel}</p>}
      <p className="mt-2 text-sm text-texto">{alerta.mensagem}</p>
      {!alerta.resolvido && <p className="mt-1 text-sm text-suave">{info.dica}</p>}

      {alerta.desperdicioEstimadoLitros > 0 && (
        <p className="mt-3 text-sm text-texto">
          Desperdício estimado: <strong className="numero">{litros(alerta.desperdicioEstimadoLitros)}</strong>
        </p>
      )}

      <div className="mt-auto pt-4">
        {alerta.resolvido ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-musgo-escuro">
            <Icone nome="check" className="h-4 w-4" /> {info.feito}
          </p>
        ) : (
          aoConfirmarReparo && (
            <button
              onClick={() => aoConfirmarReparo(alerta.id)}
              disabled={confirmando}
              className="btn-primario w-full sm:w-auto"
            >
              <Icone nome="check" className="h-4 w-4" />
              {confirmando ? "Salvando…" : info.acao}
            </button>
          )
        )}
      </div>
    </article>
  );
}
