import { Icone } from "./Icone";
import { Mostrador, PonteiroLitros } from "./Mostrador";

/**
 * Moldura das telas sem login (entrar e criar conta).
 * Celular: faixa da marca no topo e formulário embaixo. Desktop: duas colunas, com o mostrador à esquerda.
 */
export function TelaAcesso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      <div className="flex flex-col bg-tinta px-6 pt-10 pb-8 text-white md:justify-between md:px-12 md:py-12">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
            <Icone nome="gota" className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold">Gota Certa</span>
        </div>

        <div className="mt-6 md:mt-0">
          <p className="max-w-md text-xl leading-snug font-semibold md:text-3xl md:leading-tight">
            Hoje o vazamento só aparece na conta. Com a Gota Certa, ele aparece no celular, no mesmo dia.
          </p>
          <div className="mt-8 hidden items-end gap-6 md:flex">
            <PonteiroLitros vazaoLpm={1.2} />
            <Mostrador litros={1_234_582} />
          </div>
        </div>

        <p className="mt-6 hidden max-w-sm text-sm text-white/75 md:block">
          Um sensor óptico preso por fora do vidro conta as voltas do ponteiro de litros. O hidrômetro continua o mesmo.
        </p>
      </div>

      <div className="flex items-start justify-center px-6 pt-8 pb-12 md:items-center md:px-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-tinta">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
