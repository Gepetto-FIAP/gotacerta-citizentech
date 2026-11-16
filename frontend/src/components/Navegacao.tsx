"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone, type NomeIcone } from "./Icone";
import { useAuth } from "@/context/AuthContext";
import { useAlertas } from "@/context/AlertasContext";

interface Item {
  href: string;
  rotulo: string;
  icone: NomeIcone;
}

const ITENS_MORADOR: Item[] = [
  { href: "/painel", rotulo: "Painel", icone: "gota" },
  { href: "/alertas", rotulo: "Alertas", icone: "sino" },
  { href: "/historico", rotulo: "Histórico", icone: "grafico" },
  { href: "/imoveis", rotulo: "Imóveis", icone: "casa" },
];

// O gestor ganha a aba "Bairros" (visão de todos os imóveis) no lugar de destaque.
const ITENS_GESTOR: Item[] = [{ href: "/gestor", rotulo: "Bairros", icone: "bairro" }, ...ITENS_MORADOR];

function useItens() {
  const pathname = usePathname();
  const { ehGestor } = useAuth();
  const { ativos } = useAlertas();
  const itens = ehGestor ? ITENS_GESTOR : ITENS_MORADOR;
  return itens.map((item) => ({
    ...item,
    ativo: pathname.startsWith(item.href),
    contador: item.href === "/alertas" ? ativos.length : 0,
  }));
}

function Contador({ valor, className = "" }: { valor: number; className?: string }) {
  if (valor === 0) return null;
  return (
    <span className={`min-w-5 rounded-full bg-ponteiro px-1.5 text-center text-[11px] leading-5 font-bold text-white ${className}`}>
      {valor}
      <span className="sr-only"> alertas ativos</span>
    </span>
  );
}

/** Celular e telas pequenas: barra fixa embaixo, ao alcance do polegar. */
export function NavegacaoInferior() {
  const itens = useItens();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {itens.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={item.ativo ? "page" : undefined}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                item.ativo ? "text-tinta" : "text-suave hover:text-tinta"
              }`}
            >
              {item.ativo && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-agua" aria-hidden="true" />}
              <span className="relative">
                <Icone nome={item.icone} className="h-6 w-6" />
                <Contador valor={item.contador} className="absolute -top-1.5 -right-2.5" />
              </span>
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Tablet e computador: menu lateral fixo com a marca, as seções e o usuário. */
export function NavegacaoLateral({ nome, perfil, aoSair }: { nome: string; perfil: string; aoSair: () => void }) {
  const itens = useItens();
  return (
    <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col border-r border-linha bg-white px-3 py-5 md:flex lg:w-60">
      <Marca className="px-3" />

      <nav aria-label="Navegação principal" className="mt-8 flex-1">
        <ul className="space-y-1">
          {itens.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.ativo ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                  item.ativo ? "bg-agua-claro text-tinta" : "text-suave hover:bg-papel hover:text-tinta"
                }`}
              >
                <Icone nome={item.icone} className="h-5 w-5" />
                <span className="flex-1">{item.rotulo}</span>
                <Contador valor={item.contador} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-linha px-3 pt-4">
        <p className="truncate text-sm font-semibold text-texto">{nome}</p>
        <p className="text-xs text-suave">{perfil}</p>
        <button onClick={aoSair} className="mt-3 flex min-h-10 items-center gap-2 text-sm font-medium text-suave hover:text-tinta">
          <Icone nome="sair" className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}

export function Marca({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-tinta text-white">
        <Icone nome="gota" className="h-5 w-5" />
      </span>
      <span className="text-base font-bold text-tinta">Gota Certa</span>
    </div>
  );
}
