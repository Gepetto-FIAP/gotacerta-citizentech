import { Icone } from "./Icone";

export function TelaCarregando() {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 text-agua-escuro">
      <Icone nome="gota" className="h-12 w-12 animate-pulse" />
      <span className="text-sm font-medium">Carregando…</span>
    </div>
  );
}
