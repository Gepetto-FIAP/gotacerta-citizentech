import { Icone } from "./Icone";

// Os 4 estados que toda tela precisa mostrar (cartão do Danilo, pág. 20):
// carregando, vazio, erro de conexão e sucesso (o sucesso é o próprio conteúdo + os avisos/toasts).

export function Carregando({ linhas = 3, rotulo = "Carregando…" }: { linhas?: number; rotulo?: string }) {
  return (
    <div role="status" aria-label={rotulo} className="space-y-3">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-linha/60" />
      ))}
      <span className="sr-only">{rotulo}</span>
    </div>
  );
}

export function Vazio({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-dashed border-linha bg-white px-6 py-10 text-center">
      <Icone nome="gota" className="mx-auto h-10 w-10 text-agua" />
      <p className="mt-3 font-semibold text-texto">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-suave">{texto}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** Erro que impede mostrar a tela (não temos nenhum dado). */
export function ErroTela({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-xl border border-ponteiro/25 bg-ponteiro-claro px-6 py-10 text-center">
      <Icone nome="semConexao" className="mx-auto h-10 w-10 text-ponteiro" />
      <p className="mt-3 font-semibold text-ponteiro">Não foi possível carregar</p>
      <p className="mt-1 text-sm text-ponteiro">{mensagem}</p>
      <button onClick={aoTentar} className="btn-secundario mt-5">
        <Icone nome="atualizar" className="h-4 w-4" />
        Tentar de novo
      </button>
    </div>
  );
}

/** Erro com dados antigos ainda na tela (ex.: a API caiu no meio do polling). */
export function AvisoErro({ mensagem }: { mensagem: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-latao-claro px-3 py-2 text-sm text-latao-escuro ring-1 ring-latao/30">
      <Icone nome="semConexao" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {mensagem} <span className="text-latao-escuro">Mostrando os últimos dados recebidos.</span>
      </span>
    </div>
  );
}
