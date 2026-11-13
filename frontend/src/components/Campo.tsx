import { forwardRef, useId } from "react";
import { Icone } from "./Icone";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  erro?: string | null;
  dica?: string;
  /** Campo preenchido automaticamente (ex.: pelo CEP): fica só leitura, com um cadeado. */
  travado?: boolean;
};

/** Campo de formulário com rótulo, dica e mensagem de erro ligados ao input (acessível). */
export const Campo = forwardRef<HTMLInputElement, Props>(function Campo(
  { rotulo, erro, dica, travado, id, className, ...props },
  ref,
) {
  const gerado = useId();
  const campoId = id ?? gerado;
  const dicaId = `${campoId}-dica`;
  const erroId = `${campoId}-erro`;

  return (
    <div>
      <label htmlFor={campoId} className="text-sm font-medium text-texto">
        {rotulo}
      </label>
      <div className="relative mt-1">
        <input
          ref={ref}
          id={campoId}
          className={`${className ?? "campo"} mt-0 ${travado ? "cursor-default border-transparent bg-linha/40 pr-10 text-texto focus:ring-0" : ""}`}
          readOnly={travado || props.readOnly}
          aria-invalid={erro ? true : undefined}
          aria-describedby={[dica && dicaId, erro && erroId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {travado && (
          <Icone nome="cadeado" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-suave" />
        )}
      </div>
      {dica && !erro && (
        <p id={dicaId} className="mt-1 text-xs text-suave">
          {dica}
        </p>
      )}
      {erro && (
        <p id={erroId} className="mt-1 text-xs font-medium text-ponteiro">
          {erro}
        </p>
      )}
    </div>
  );
});
