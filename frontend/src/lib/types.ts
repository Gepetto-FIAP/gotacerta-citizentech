// Tipos que espelham os DTOs e entidades da API C# (backend/GotaCerta.Api).
// O ASP.NET serializa em camelCase, por isso os nomes começam com letra minúscula.

export type Perfil = "MORADOR" | "ADMIN";

export type Severidade = "BAIXA" | "MEDIA" | "CRITICA";

export type TipoAlerta =
  | "VAZAMENTO_OCULTO_MADRUGADA"
  | "CANO_ROMPIDO_PICO"
  | "META_MENSAL_ULTRAPASSADA";

export type TipoSensor = "LED_IR" | "FOTOTRANSISTOR";

/** Resposta de POST /api/auth/login e /api/auth/register (AuthResponseDto). */
export interface Sessao {
  usuarioId: number;
  nome: string;
  email: string;
  perfil: Perfil;
  tokenJwt: string;
  expiraEm: string;
}

export interface Sensor {
  id: number;
  imovelId: number;
  codigoDispositivo: string;
  tipoSensor: TipoSensor;
  fatorCalibracaoPulsosLitro: number;
  limiteVazaoAlertaLpm: number;
  statusAtivo: boolean;
}

export interface Alerta {
  id: number;
  imovelId: number;
  leituraId: number | null;
  tipoAlerta: TipoAlerta;
  severidade: Severidade;
  mensagem: string;
  desperdicioEstimadoLitros: number;
  resolvido: boolean;
  dataGeracao: string;
}

export interface Imovel {
  id: number;
  usuarioId: number;
  apelidoLocal: string;
  endereco: string;
  bairro: string;
  cep: string;
  numeroSerieHidrometro: string;
  metaConsumoMensalLitros: number;
  sensores: Sensor[];
  alertas: Alerta[];
}

/** GET /api/imoveis/{id}/dashboard (ImovelDashboardDto). */
export interface Dashboard {
  imovelId: number;
  apelidoLocal: string;
  bairro: string;
  numeroSerieHidrometro: string;
  vazaoAtualLpm: number;
  leituraAtualMostradorLitros: number;
  consumoMesLitros: number;
  metaConsumoMensalLitros: number;
  percentualMetaConsumida: number;
  valorEstimadoReais: number;
  alertasAtivosCount: number;
  alertasAtivos: Pick<
    Alerta,
    "id" | "tipoAlerta" | "severidade" | "mensagem" | "desperdicioEstimadoLitros" | "dataGeracao"
  >[];
}

/** GET /api/imoveis/{id}/historico (ConsumoDiarioItemDto). */
export interface ConsumoDiario {
  data: string;
  consumoDiaLitros: number;
  vazaoMaximaDiaLpm: number;
  totalPulsosDia: number;
}

/** GET /api/bairros/alertas (BairroAlertaResumoDto). */
export interface ResumoBairro {
  bairro: string;
  totalImoveisMonitorados: number;
  alertasAtivos: number;
  volumeDesperdicadoLitros: number;
  consumoTotalBairroLitros: number;
}

export interface NovoImovel {
  usuarioId: number;
  apelidoLocal: string;
  endereco: string;
  bairro: string;
  cep: string;
  numeroSerieHidrometro: string;
  metaConsumoMensalLitros: number;
}

export type ImovelEditavel = Pick<
  Imovel,
  "apelidoLocal" | "endereco" | "bairro" | "metaConsumoMensalLitros"
>;

export interface NovoSensor {
  imovelId: number;
  codigoDispositivo: string;
  tipoSensor: TipoSensor;
  fatorCalibracaoPulsosLitro: number;
  limiteVazaoAlertaLpm: number;
}
