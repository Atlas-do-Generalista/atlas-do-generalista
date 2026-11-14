export interface GlasgowInput {
  ocular?: number | string | null;
  verbal?: number | string | null;
  motor?: number | string | null;
  avaliacaoLimitada?: boolean | string | null;
  preSedacao?: number | string | null;
  // Campos de rastreabilidade temporal (opcionais, com retrocompatibilidade integral)
  preSedacaoDataHora?: string | null;
  preSedacaoTempoDecorridoHoras?: number | string | null;
  dataHoraReferencia?: string | Date | null;
}

export type GlasgowOrigem = 'calculado_atual' | 'pre_sedacao' | 'indeterminado';

export type ConfiabilidadeTemporal = 'adequada' | 'alerta_tempo_prolongado' | 'tempo_nao_informado';

export interface GlasgowRastreabilidadeTemporal {
  dataHora?: string;
  horasDecorridas?: number;
  confiabilidade: ConfiabilidadeTemporal;
  aviso?: string;
}

export interface GlasgowResult {
  gcs: number | null;
  ocular: number | null;
  verbal: number | null;
  motor: number | null;
  avaliacaoLimitada: boolean;
  preSedacao: number | null;
  origem: GlasgowOrigem;
  rotuloFormatado: string;
  rastreabilidadeTemporal?: GlasgowRastreabilidadeTemporal;
  detalhes: {
    completo: boolean;
    componentesValidos: boolean;
    motivo?: string;
  };
}
