import type { IDGState, IDGEvaluation, SOAPTag } from '../types';
import { evaluateHypotheses } from './differentials';
import { evaluateSafetyAlerts } from './safety';
import { selectAdaptiveQuestions } from './adaptive-questions';
import { recommendDiagnosticTests } from './test-recommender';
import { evaluateIntegratedScores } from './calc-adapters';
import { generateSynthesis } from './synthesis';
import { analyzeProblemGroups } from './cross-synthesis';

export function evaluateIDGState(state: IDGState): IDGEvaluation {
  // 1. Agrupamento de problemas e etiologia unificadora (Problema A + B -> C)
  const problemIntegration = analyzeProblemGroups(state);

  // 2. Gera e avalia hipóteses nos dois eixos com matriz quadridimensional
  const { axis1Probable, axis2Critical, unconsideredDangerous } = evaluateHypotheses(state);

  // 3. Avalia alertas críticos de segurança imediatos
  const activeSafetyAlerts = evaluateSafetyAlerts(state);

  // 4. Seleciona perguntas adaptativas discriminatórias
  const suggestedQuestions = selectAdaptiveQuestions(state, axis1Probable, axis2Critical);

  // 5. Recomenda exames com limitações e especificidades
  const suggestedTests = recommendDiagnosticTests(state, axis1Probable, axis2Critical);

  // 6. Integra escores do calc-engine
  const integratedScores = evaluateIntegratedScores(state, axis1Probable, axis2Critical);

  // 7. Determina tag de versão da sessão SOAP
  const tag: SOAPTag = state.currentTag || '[Inicial]';

  // 8. Produz a síntese clínica estruturada e modelo SOAP
  const synthesis = generateSynthesis(
    state,
    axis1Probable,
    axis2Critical,
    activeSafetyAlerts,
    suggestedTests,
    problemIntegration,
    tag,
  );

  return {
    axis1Probable,
    axis2Critical,
    unconsideredDangerous,
    problemIntegration,
    activeSafetyAlerts,
    suggestedQuestions,
    suggestedTests,
    integratedScores,
    synthesis,
    soap: synthesis.soap,
  };
}
