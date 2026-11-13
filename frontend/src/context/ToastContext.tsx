"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type TipoToast = "sucesso" | "erro" | "alerta";

interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

interface ToastValor {
  mostrar: (texto: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastValor | null>(null);

const ESTILO: Record<TipoToast, string> = {
  sucesso: "bg-musgo text-white",
  erro: "bg-ponteiro text-white",
  alerta: "border-l-4 border-ponteiro bg-tinta text-white",
};

/** Avisos curtos de feedback ("Reparo confirmado", "Novo alerta", erros). Somem em 4 s. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(1);

  const mostrar = useCallback((texto: string, tipo: TipoToast = "sucesso") => {
    const id = proximoId.current++;
    setToasts((lista) => [...lista.slice(-2), { id, tipo, texto }]);
    // Alerta novo fica um pouco mais na tela: é o aviso mais importante do app.
    setTimeout(() => setToasts((lista) => lista.filter((t) => t.id !== id)), tipo === "alerta" ? 6000 : 4000);
  }, []);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col gap-2 px-4 md:inset-x-auto md:right-6 md:bottom-6 md:w-96 md:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "erro" ? "alert" : "status"}
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${ESTILO[t.tipo]}`}
          >
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}
