"use client";

import { useState } from "react";
import { Campo } from "./Campo";
import { Icone } from "./Icone";

type Props = Omit<React.ComponentProps<typeof Campo>, "type">;

/** Campo de senha com botão para mostrar/esconder o que foi digitado. */
export function CampoSenha(props: Props) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <Campo {...props} type={visivel ? "text" : "password"} className="campo pr-12" />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        className="absolute top-7 right-1 grid h-11 w-11 place-items-center rounded-lg text-suave hover:text-texto"
      >
        <Icone nome={visivel ? "olhoFechado" : "olho"} />
      </button>
    </div>
  );
}
