import type {
  GlasgowInput,
  GlasgowRastreabilidadeTemporal,
  GlasgowResult,
} from './types';

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value.trim());
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }
  return false;
}

function avaliarRastreabilidade(input: GlasgowInput): GlasgowRastreabilidadeTemporal {
  let horas: number | undefined;

  const tempoHoras = parseNumber(input.preSedacaoTempoDecorridoHoras);
  if (tempoHoras !== null && tempoHoras >= 0) {
    horas = tempoHoras;
  } else if (input.preSedacaoDataHora) {
    const preTimestamp = Date.parse(input.preSedacaoDataHora);
    if (!Number.isNaN(preTimestamp)) {
      const refTimestamp = input.dataHoraReferencia
        ? (input.dataHoraReferencia instanceof Date
            ? input.dataHoraReferencia.getTime()
            : Date.parse(String(input.dataHoraReferencia)))
        : Date.now();

      if (!Number.isNaN(refTimestamp) && refTimestamp >= preTimestamp) {
        horas = (refTimestamp - preTimestamp) / (1000 * 60 * 60);
      }
    }
  }

  if (typeof horas === 'number' && Number.isFinite(horas)) {
    if (horas > 24) {
      return {
        dataHora: input.preSedacaoDataHora ? String(input.preSedacaoDataHora) : undefined,
        horasDecorridas: Number(horas.toFixed(1)),
        confiabilidade: 'alerta_tempo_prolongado',
        aviso: `GCS pré-sedação registrado há ${horas.toFixed(1)} horas (>24 h). Em UTI e emergência, o valor prévio pode não refletir a evolução intracraniana recente.`,
      };
    }
    return {
      dataHora: input.preSedacaoDataHora ? String(input.preSedacaoDataHora) : undefined,
      horasDecorridas: Number(horas.toFixed(1)),
      confiabilidade: 'adequada',
    };
  }

  return {
    dataHora: undefined,
    horasDecorridas: undefined,
    confiabilidade: 'tempo_nao_informado',
    aviso: 'Momento da avaliação neurológica pré-sedação não informado. Recomenda-se registrar a data/hora para rastreabilidade em prontuário.',
  };
}

/**
 * Derivação compartilhada e pura da Escala de Coma de Glasgow (GCS).
 *
 * Preserva estritamente a distinção clínica entre:
 * 1. Glasgow atual (soma direta de abertura ocular 1–4, resposta verbal 1–5 e resposta motora 1–6).
 * 2. Glasgow pré-sedação / pré-intubação (adotado quando a avaliação atual é limitada por sedação/intubação),
 *    com verificação de rastreabilidade temporal.
 * 3. Glasgow com avaliação limitada sem valor prévio registrado (permanece indeterminado/nulo).
 */
export function deriveGlasgow(input: GlasgowInput): GlasgowResult {
  const ocular = parseNumber(input.ocular);
  const verbal = parseNumber(input.verbal);
  const motor = parseNumber(input.motor);
  const avaliacaoLimitada = parseBoolean(input.avaliacaoLimitada);
  const preSedacao = parseNumber(input.preSedacao);

  const ocularValido = ocular !== null && ocular >= 1 && ocular <= 4;
  const verbalValido = verbal !== null && verbal >= 1 && verbal <= 5;
  const motorValido = motor !== null && motor >= 1 && motor <= 6;
  const componentesValidos = ocularValido && verbalValido && motorValido;

  // 1. Caso de avaliação limitada (sedação / intubação) com registro de GCS prévio
  if (avaliacaoLimitada && preSedacao !== null && preSedacao >= 3 && preSedacao <= 15) {
    const rastreabilidade = avaliarRastreabilidade(input);
    const avisoTexto = rastreabilidade.aviso ? ` (${rastreabilidade.aviso})` : '';
    const sufixoRotulo = rastreabilidade.confiabilidade === 'alerta_tempo_prolongado'
      ? ` (pré-sedação há >24 h [${rastreabilidade.horasDecorridas} h] — alerta temporal)`
      : ' (pré-sedação/intubação)';

    return {
      gcs: preSedacao,
      ocular,
      verbal,
      motor,
      avaliacaoLimitada: true,
      preSedacao,
      origem: 'pre_sedacao',
      rotuloFormatado: `Glasgow: ${preSedacao}${sufixoRotulo}`,
      rastreabilidadeTemporal: rastreabilidade,
      detalhes: {
        completo: true,
        componentesValidos,
        motivo: `Avaliação neurológica limitada; utilizado GCS pré-sedação/intubação.${avisoTexto}`,
      },
    };
  }

  // 2. Caso de avaliação limitada sem valor pré-sedação válido
  if (avaliacaoLimitada) {
    return {
      gcs: null,
      ocular,
      verbal,
      motor,
      avaliacaoLimitada: true,
      preSedacao,
      origem: 'indeterminado',
      rotuloFormatado: 'Glasgow: — (avaliação limitada sem registro pré-sedação)',
      detalhes: {
        completo: false,
        componentesValidos,
        motivo: 'Avaliação limitada; informe o GCS imediatamente anterior à sedação/intubação para prosseguir.',
      },
    };
  }

  // 3. Caso padrão: soma dos 3 componentes atuais
  if (componentesValidos) {
    const soma = ocular! + verbal! + motor!;
    return {
      gcs: soma,
      ocular,
      verbal,
      motor,
      avaliacaoLimitada: false,
      preSedacao,
      origem: 'calculado_atual',
      rotuloFormatado: `Glasgow: ${soma}`,
      detalhes: {
        completo: true,
        componentesValidos: true,
      },
    };
  }

  // 4. Componentes incompletos ou não informados
  return {
    gcs: null,
    ocular,
    verbal,
    motor,
    avaliacaoLimitada: false,
    preSedacao,
    origem: 'indeterminado',
    rotuloFormatado: 'Glasgow: —',
    detalhes: {
      completo: false,
      componentesValidos: false,
      motivo: 'Preencha os três componentes (abertura ocular, resposta verbal e resposta motora).',
    },
  };
}

/**
 * Função utilitária para resolver o GCS em um objeto de ContextoPaciente.
 * Permite que APACHE II e SOFA-2 recebam o GCS correto mesmo quando alimentados
 * apenas pelos componentes isolados ou pelo registro pré-sedação.
 */
export function resolverGcsNoContexto(contexto: Record<string, any>): number | undefined {
  if (typeof contexto.gcs === 'number' && Number.isFinite(contexto.gcs)) {
    return contexto.gcs;
  }

  const derived = deriveGlasgow({
    ocular: contexto.glasgow_ocular,
    verbal: contexto.glasgow_verbal,
    motor: contexto.glasgow_motor,
    avaliacaoLimitada: contexto.glasgow_avaliacao_limitada,
    preSedacao: contexto.glasgow_pre_sedacao,
    preSedacaoDataHora: contexto.glasgow_pre_sedacao_data_hora,
    preSedacaoTempoDecorridoHoras: contexto.glasgow_pre_sedacao_tempo_decorrido_horas,
  });

  return derived.gcs ?? undefined;
}
