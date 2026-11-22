/**
 * Módulo de Raciocínio Bayesiano e Evidência Diagnóstica
 * Atlas do Generalista — IDG
 *
 * Regras estritas:
 * 1. Não inventar parâmetros ou razões de verossimilhança.
 * 2. Ausência de parâmetro resulta em avaliação qualitativa explicável, nunca número simulado.
 * 3. Proteger contra divisão por zero e limites de probabilidade (0 a 1).
 * 4. Não multiplicar cegamente achados dependentes como se fossem estatisticamente independentes.
 */

export interface BayesCalculationResult {
  preTestProbability: number;
  preTestOdds: number;
  likelihoodRatio: number;
  postTestOdds: number;
  postTestProbability: number;
  isValid: boolean;
  warnings: string[];
}

export interface PredictiveValuesResult {
  prevalence: number;
  sensitivity: number;
  specificity: number;
  positivePredictiveValue: number;
  negativePredictiveValue: number;
  positiveLikelihoodRatio: number;
  negativeLikelihoodRatio: number;
  isValid: boolean;
  error?: string;
}

/**
 * Converte probabilidade [0, 1] em odds [0, Infinity).
 */
export function probabilityToOdds(probability: number): number {
  if (probability < 0 || probability > 1 || !Number.isFinite(probability)) {
    throw new Error(`Probabilidade inválida: ${probability}. Deve estar entre 0 e 1.`);
  }
  if (probability >= 1) return Infinity;
  return probability / (1 - probability);
}

/**
 * Converte odds [0, Infinity) em probabilidade [0, 1].
 */
export function oddsToProbability(odds: number): number {
  if (odds < 0 || !Number.isFinite(odds)) {
    if (odds === Infinity) return 1.0;
    throw new Error(`Odds inválido: ${odds}. Deve ser maior ou igual a zero.`);
  }
  return odds / (1 + odds);
}

/**
 * Calcula a probabilidade e odds pós-teste a partir da probabilidade pré-teste e da razão de verossimilhança.
 */
export function calculatePostTest(
  preTestProbability: number,
  likelihoodRatio: number,
): BayesCalculationResult {
  const warnings: string[] = [];

  if (preTestProbability <= 0 || preTestProbability >= 1) {
    return {
      preTestProbability,
      preTestOdds: preTestProbability <= 0 ? 0 : Infinity,
      likelihoodRatio,
      postTestOdds: preTestProbability <= 0 ? 0 : Infinity,
      postTestProbability: preTestProbability <= 0 ? 0 : 1,
      isValid: false,
      warnings: ['Probabilidade pré-teste extrema (0 ou 1) inviabiliza raciocínio bayesiano.'],
    };
  }

  if (likelihoodRatio < 0 || !Number.isFinite(likelihoodRatio)) {
    return {
      preTestProbability,
      preTestOdds: probabilityToOdds(preTestProbability),
      likelihoodRatio,
      postTestOdds: NaN,
      postTestProbability: NaN,
      isValid: false,
      warnings: ['Razão de verossimilhança inválida ou indefinida.'],
    };
  }

  const preOdds = probabilityToOdds(preTestProbability);
  const postOdds = preOdds * likelihoodRatio;
  const postProb = oddsToProbability(postOdds);

  if (likelihoodRatio === 1) {
    warnings.push('RV = 1,0: o achado não altera a probabilidade pré-teste.');
  }

  return {
    preTestProbability,
    preTestOdds: preOdds,
    likelihoodRatio,
    postTestOdds: postOdds,
    postTestProbability: postProb,
    isValid: true,
    warnings,
  };
}

/**
 * Calcula VPP e VPN para uma prevalência dada, com sensibilidade e especificidade.
 * Permite recalibrar os valores preditivos para prevalências distintas da coorte original.
 */
export function calculatePredictiveValues(
  sensitivity: number,
  specificity: number,
  prevalence: number,
): PredictiveValuesResult {
  if (
    sensitivity < 0 || sensitivity > 1 ||
    specificity < 0 || specificity > 1 ||
    prevalence <= 0 || prevalence >= 1
  ) {
    return {
      prevalence,
      sensitivity,
      specificity,
      positivePredictiveValue: NaN,
      negativePredictiveValue: NaN,
      positiveLikelihoodRatio: NaN,
      negativeLikelihoodRatio: NaN,
      isValid: false,
      error: 'Parâmetros fora da faixa biológica válida [0, 1].',
    };
  }

  const lrPos = specificity === 1 ? Infinity : sensitivity / (1 - specificity);
  const lrNeg = specificity === 0 ? NaN : (1 - sensitivity) / specificity;

  const truePos = sensitivity * prevalence;
  const falsePos = (1 - specificity) * (1 - prevalence);
  const trueNeg = specificity * (1 - prevalence);
  const falseNeg = (1 - sensitivity) * prevalence;

  const ppvDenom = truePos + falsePos;
  const ppv = ppvDenom > 0 ? truePos / ppvDenom : 0;

  const npvDenom = trueNeg + falseNeg;
  const npv = npvDenom > 0 ? trueNeg / npvDenom : 0;

  return {
    prevalence,
    sensitivity,
    specificity,
    positivePredictiveValue: ppv,
    negativePredictiveValue: npv,
    positiveLikelihoodRatio: lrPos,
    negativeLikelihoodRatio: lrNeg,
    isValid: true,
  };
}

/**
 * Combina com segurança achados diagnósticos com cautela sobre dependência condicional.
 * Quando múltiplos achados apontam na mesma direção, aplica atenuação conservadora
 * para evitar inflação artificial de probabilidade devida à suposição ingênua de independência.
 */
export function combineLikelihoodRatios(
  lrs: number[],
  areAssumedIndependent = false,
): { combinedLR: number; cautionNote: string } {
  if (lrs.length === 0) {
    return { combinedLR: 1.0, cautionNote: 'Nenhum achado com RV documentada.' };
  }

  if (lrs.length === 1) {
    return {
      combinedLR: lrs[0],
      cautionNote: 'Baseado em achado único com razão de verossimilhança validada.',
    };
  }

  if (areAssumedIndependent) {
    const rawMultiplication = lrs.reduce((acc, curr) => acc * curr, 1.0);
    return {
      combinedLR: rawMultiplication,
      cautionNote:
        'Atenção: multiplicação bayesiana ingênua. Assume independência condicional completa entre os achados.',
    };
  }

  // Atenuação conservadora: aplica raiz enésima amortecida para achados potencialmente correlacionados
  // Evita que múltiplos achados de dor aguda resultem em LR de 1000x artificial.
  // Regra clínica responsável: o achado mais forte prevalece com 100% de peso; achados adicionais contribuem com peso decrescente.
  const sorted = [...lrs].sort((a, b) => Math.abs(Math.log(b)) - Math.abs(Math.log(a)));
  let logCombined = Math.log(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    // Fator de decaimento por correlação clínica esperada
    const dampeningFactor = 1 / (i + 1);
    logCombined += Math.log(sorted[i]) * dampeningFactor;
  }

  const combinedLR = Math.exp(logCombined);

  return {
    combinedLR,
    cautionNote:
      'Combinação conservadora com atenuação de dependência condicional. Achados clínicos da mesma síndrome frequentemente compartilham variância.',
  };
}
