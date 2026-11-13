import {
  ArrowLeft,
  Bell,
  Building2,
  ChartColumn,
  Check,
  Droplet,
  Eye,
  EyeOff,
  House,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

// Ícones da biblioteca Lucide (licença ISC). As telas usam um nome em português,
// então trocar um ícone é mudar uma linha aqui.
const ICONES = {
  gota: Droplet,
  sino: Bell,
  grafico: ChartColumn,
  casa: House,
  bairro: Building2,
  sair: LogOut,
  mais: Plus,
  check: Check,
  semConexao: WifiOff,
  lixeira: Trash2,
  lapis: Pencil,
  olho: Eye,
  olhoFechado: EyeOff,
  atualizar: RefreshCw,
  cadeado: Lock,
  voltar: ArrowLeft,
} satisfies Record<string, LucideIcon>;

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, className = "h-5 w-5" }: { nome: NomeIcone; className?: string }) {
  const Componente = ICONES[nome];
  return <Componente className={className} strokeWidth={1.75} aria-hidden="true" />;
}
