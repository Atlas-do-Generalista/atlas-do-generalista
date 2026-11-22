import type { IDGState, ScoreAdapterResult, EvaluatedHypothesis } from '../types';
import type { ContextoPaciente, Calculadora } from '../../calc-engine/types';
import { registry } from '../../calc-engine/registry';

export function evaluateIntegratedScores(
  state: IDGState,
  axis1: EvaluatedHypothesis[],
  axis2: EvaluatedHypothesis[],
): ScoreAdapterResult[] {
  const patientContext: ContextoPaciente = {
    ...state.importedPatientContext,
  };

  // Achados qualitativos não são convertidos em valores numéricos fictícios.
  // Cada escore recebe apenas medidas efetivamente registradas no ContextoPaciente.

  // Seleciona escores relevantes dependendo da apresentação e hipóteses
  const relevantCalcIds = new Set<string>();

  const hasPresentation = (id: string) => state.presentations.includes(id as any);
  const hasHypothesis = (id: string) =>
    axis1.some((h) => h.def.id === id) || axis2.some((h) => h.def.id === id);

  if (hasPresentation('febre') || hasPresentation('choque') || hasHypothesis('sepse_choque_septico')) {
    relevantCalcIds.add('news2');
    relevantCalcIds.add('sofa-2');
    relevantCalcIds.add('qsofa');
    relevantCalcIds.add('shock-index');
  }

  if (hasPresentation('dor_toracica') || hasHypothesis('sca') || hasHypothesis('disseccao_aorta') || hasHypothesis('tep')) {
    relevantCalcIds.add('news2');
    relevantCalcIds.add('shock-index');
    relevantCalcIds.add('pam');
    relevantCalcIds.add('pressao-pulso');
  }

  if (hasPresentation('dor_abdominal') || hasHypothesis('isquemia_mesenterica_aguda') || hasHypothesis('pancreatite_aguda')) {
    relevantCalcIds.add('news2');
    relevantCalcIds.add('shock-index');
    relevantCalcIds.add('anion-gap');
  }

  if (hasPresentation('dor_vertebral')) {
    relevantCalcIds.add('padua');
  }

  // Sempre inclui NEWS2 e Shock Index como triagem básica de deterioração se houver sinais vitais
  relevantCalcIds.add('news2');
  relevantCalcIds.add('shock-index');

  const results: ScoreAdapterResult[] = [];

  for (const calcId of relevantCalcIds) {
    const calc = registry.find((c) => c.id === calcId);
    if (!calc) continue;

    const result = runCalculatorAdapter(calc, patientContext);
    results.push(result);
  }

  return results;
}

function runCalculatorAdapter(
  calc: Calculadora,
  dados: ContextoPaciente,
): ScoreAdapterResult {
  const faltando = calc.obterEntradasFaltantes
    ? [...calc.obterEntradasFaltantes(dados)]
    : calc.entradas.filter((campo) => dados[campo] === null || dados[campo] === undefined || dados[campo] === '');

  if (faltando.length > 0) {
    return {
      scoreId: calc.id,
      scoreName: calc.nome,
      targetHypotheses: [calc.dominio],
      status: 'incompleto',
      missingFields: faltando,
      clinicalInterpretation: `Aguardando preenchimento dos parâmetros: ${faltando.join(', ')}.`,
      limitations: calc.notasClinicas?.join(' ') ?? 'Ferramenta de estratificação auxiliar.',
      validationPopulation: calc.referencias?.[0]?.titulo ?? 'População de emergência/terapia intensiva.',
      reference: calc.referencias?.[0]?.citacao ?? 'Diretrizes Clínicas do Atlas.',
    };
  }

  const problemas = calc.validar?.(dados) ?? [];
  if (problemas.length > 0) {
    return {
      scoreId: calc.id,
      scoreName: calc.nome,
      targetHypotheses: [calc.dominio],
      status: 'erro',
      clinicalInterpretation: `Erro de validação clínica: ${problemas.join('; ')}`,
      limitations: 'Valores fornecidos fora da faixa biológica válida.',
      validationPopulation: 'Não aplicável.',
      reference: 'Atlas do Generalista.',
    };
  }

  try {
    const output = calc.calcular(dados);
    return {
      scoreId: calc.id,
      scoreName: calc.nome,
      targetHypotheses: [calc.dominio],
      status: 'ok',
      value: output.valor,
      summary: output.resumo,
      clinicalInterpretation: `${output.interpretacao} ${output.recomendacao ?? ''}`,
      limitations: calc.notasClinicas?.join(' ') ?? 'Escores não substituem o julgamento clínico individualizado.',
      validationPopulation: calc.referencias?.[0]?.titulo ?? 'População clínica validada.',
      reference: calc.referencias?.[0]?.citacao ?? 'Atlas do Generalista.',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro no cálculo.';
    return {
      scoreId: calc.id,
      scoreName: calc.nome,
      targetHypotheses: [calc.dominio],
      status: 'erro',
      clinicalInterpretation: msg,
      limitations: 'Falha durante o processamento numérico.',
      validationPopulation: 'Não aplicável.',
      reference: 'Atlas do Generalista.',
    };
  }
}
