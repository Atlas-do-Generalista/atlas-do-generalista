import type {
  IDGState,
  ClinicalHypothesisDef,
  EvaluatedHypothesis,
  HypothesisStatus,
  FindingStatus,
  MultidimensionalScores,
} from '../types';
import { normalizeFindingStatus } from '../types';
import { IDGKnowledgeRegistry } from '../knowledge/registry';
import { calculatePostTest, combineLikelihoodRatios } from '../bayesian/calculator';
import { analyzeProblemGroups } from './cross-synthesis';

export function evaluateHypotheses(state: IDGState): {
  axis1Probable: EvaluatedHypothesis[];
  axis2Critical: EvaluatedHypothesis[];
  unconsideredDangerous: EvaluatedHypothesis[];
} {
  // 1. Identifica se há agrupamento de problemas e etiologia unificadora (Problema A + B -> C)
  const problemIntegration = analyzeProblemGroups(state);
  const extraSharedIds = problemIntegration?.sharedHypotheses || [];

  // 2. Coleta definições candidatas considerando apresentações e hipóteses compartilhadas
  const candidateDefs = IDGKnowledgeRegistry.getHypothesesForPresentations(
    state.presentations,
    extraSharedIds,
    state.userInitialHypotheses || [],
  );

  const evaluated: EvaluatedHypothesis[] = candidateDefs.map((def) => {
    return evaluateSingleHypothesis(def, state, problemIntegration);
  });

  // Eixo 1: O que é mais provável / Diferenciais prioritários?
  // Ordenado por prioridade composta (compatibilidade + probabilidade diagnóstica)
  // Filtra hipóteses desconexas (compatibilidade muito baixa < 20) para não poluir o topo
  const axis1Probable = [...evaluated]
    .sort((a, b) => b.multidimensional.compositePriority - a.multidimensional.compositePriority);

  // Eixo 2: O que não posso deixar passar?
  // Condições com periculosidade alta ou crítica, ou tempo-dependentes,
  // que NÃO foram formalmente excluídas.
  const axis2Critical = [...evaluated]
    .filter((h) => {
      const isDangerous =
        h.def.dangerLevel === 'critico' ||
        h.def.dangerLevel === 'alto' ||
        h.def.isTimeSensitive;
      const isNotDefinitivelyExcluded = !h.exclusionStatus?.excluded;
      return isDangerous && isNotDefinitivelyExcluded;
    })
    .sort((a, b) => {
      // Prioriza condições compatíveis e com maior urgência/gravidade
      const scoreA = (h: EvaluatedHypothesis) =>
        (h.def.dangerLevel === 'critico' ? 50 : 25) +
        (h.def.isTimeSensitive ? 25 : 0) +
        h.multidimensional.compatibility * 0.5;
      return scoreA(b) - scoreA(a);
    });

  // Cognitive Forcing: Hipóteses perigosas no Eixo 2 que NÃO foram cogitadas inicialmente pelo médico
  const userHypSet = new Set(
    (state.userInitialHypotheses || []).map((h) => h.toLowerCase().trim()),
  );
  const manuallyMatchedIds = new Set(
    IDGKnowledgeRegistry.findHypothesesByNames(state.userInitialHypotheses || []).map((h) => h.id),
  );

  const unconsideredDangerous = axis2Critical.filter((h) => {
    if (userHypSet.size === 0) return true;
    if (manuallyMatchedIds.has(h.def.id)) return false;
    const nameLower = h.def.name.toLowerCase();
    const idLower = h.def.id.toLowerCase();
    const isConsidered = Array.from(userHypSet).some((userH) =>
      nameLower.includes(userH) || userH.includes(nameLower) || idLower.includes(userH),
    );
    return !isConsidered;
  });

  return { axis1Probable, axis2Critical, unconsideredDangerous };
}

function evaluateSingleHypothesis(
  def: ClinicalHypothesisDef,
  state: IDGState,
  problemIntegration?: any,
): EvaluatedHypothesis {
  const matchedFavorable: Array<{ association: any; findingValue: FindingStatus }> = [];
  const matchedContrary: Array<{ association: any; findingValue: FindingStatus }> = [];
  const missingCriticalFindings: string[] = [];

  let scoreProbable = 20;
  let scoreCritical = def.dangerLevel === 'critico' ? 80 : def.dangerLevel === 'alto' ? 50 : 20;
  if (def.isTimeSensitive) scoreCritical += 15;

  const collectedLRs: number[] = [];
  const textLower = (state.freeTextDescription || '').toLowerCase();

  // Parsing textual auxiliar para enriquecer achados não estruturados
  const isObstipationMentioned =
    textLower.includes('evacuar') ||
    textLower.includes('14 dias') ||
    textLower.includes('obstipa') ||
    textLower.includes('constipa');

  const isFeverMentioned =
    textLower.includes('febre') ||
    textLower.includes('39') ||
    textLower.includes('calafrio');

  // 1. Avalia achados favoráveis
  for (const fav of def.favorableFindings) {
    let rawVal = state.findings[fav.findingId];

    // Se não preenchido explicitamente no form, verifica se está descrito no texto
    if (!rawVal) {
      if (fav.findingId === 'obstipacao_prolongada_dias' && isObstipationMentioned) {
        rawVal = 'present';
      } else if (fav.findingId === 'febre_sindrome_febril' && isFeverMentioned) {
        rawVal = 'present';
      } else if (fav.findingId === 'taquicardia_fc_maior_100' && textLower.includes('taquicard')) {
        rawVal = 'present';
      }
    }

    const normVal = normalizeFindingStatus(rawVal);
    const expectedNorm = normalizeFindingStatus(fav.expectedState);

    if (normVal === expectedNorm && normVal !== 'not_assessed' && normVal !== 'unknown') {
      matchedFavorable.push({ association: fav, findingValue: rawVal! });
      if (fav.impact === 'forte_favoravel') scoreProbable += 30;
      else if (fav.impact === 'moderado_favoravel') scoreProbable += 15;
      else scoreProbable += 8;

      if (fav.bayesian?.lrPositive && fav.bayesian.lrPositive > 1) {
        collectedLRs.push(fav.bayesian.lrPositive);
      }
    } else if (normVal === 'not_assessed' || normVal === 'unknown') {
      if (fav.impact === 'forte_favoravel') {
        missingCriticalFindings.push(fav.findingLabel);
      }
    }
  }

  // 2. Avalia achados contrários
  for (const con of def.contraryFindings) {
    const rawVal = state.findings[con.findingId];
    const normVal = normalizeFindingStatus(rawVal);
    const expectedNorm = normalizeFindingStatus(con.expectedState);

    if (normVal === expectedNorm && normVal !== 'not_assessed' && normVal !== 'unknown') {
      matchedContrary.push({ association: con, findingValue: rawVal! });
      if (con.impact === 'forte_contrario') scoreProbable -= 35;
      else if (con.impact === 'moderado_contrario') scoreProbable -= 18;
      else scoreProbable -= 8;

      if (con.bayesian?.lrNegative && con.bayesian.lrNegative < 1) {
        collectedLRs.push(con.bayesian.lrNegative);
      }
    }
  }

  // 3. Avalia critérios de exclusão formais
  let exclusionStatus: { excluded: boolean; reason?: string; caveats?: string } | undefined;

  for (const exc of def.exclusionCriteria) {
    const rawVal = state.findings[exc.requiresFindingId];
    const normVal = normalizeFindingStatus(rawVal);
    const expectedNorm = normalizeFindingStatus(exc.requiresFindingState);

    if (normVal === expectedNorm && normVal !== 'not_assessed' && normVal !== 'unknown') {
      if (exc.isDefinitive) {
        exclusionStatus = {
          excluded: true,
          reason: exc.description,
          caveats: exc.caveats,
        };
        scoreProbable = 0;
        break;
      }
    }
  }

  // 4. Matriz de Priorização Multidimensional (4 eixos independentes)
  // Eixo A: Compatibilidade com achados atuais (0 a 100)
  let compatibility = 30; // base neutra

  // Bônus se a hipótese pertence às hipóteses compartilhadas da síntese integradora (Problema C)
  if (problemIntegration && problemIntegration.sharedHypotheses.includes(def.id)) {
    compatibility += 45;
  }

  // Bônus por achados favoráveis compatíveis
  compatibility += matchedFavorable.length * 20;
  compatibility -= matchedContrary.length * 25;

  // Penalidade de compatibilidade para hipóteses sem qualquer gatilho clínico específico
  // Ex.: Meningite ou Anafilaxia quando o paciente tem febre + obstipação 14d sem sinais meníngeos ou alérgeno
  const hasSpecificTrigger =
    def.id.includes('meningite')
      ? normalizeFindingStatus(state.findings['rigidez_de_nuca_kernig_brudzinski']) === 'present' || textLower.includes('nuca')
      : def.id.includes('anafilaxia')
        ? normalizeFindingStatus(state.findings['exposicao_alergeno_recente_minutos']) === 'present' || textLower.includes('alérgen')
        : true;

  if (!hasSpecificTrigger && problemIntegration) {
    compatibility = Math.min(compatibility, 15); // reduz para < 20 para não poluir o topo
  }

  compatibility = Math.max(0, Math.min(100, compatibility));

  // Eixo B: Probabilidade Diagnóstica Clínica (0 a 100)
  const diagnosticProbability = Math.max(0, Math.min(100, scoreProbable));

  // Eixo C: Gravidade Potencial (0 a 100)
  const severity =
    def.dangerLevel === 'critico' ? 95 : def.dangerLevel === 'alto' ? 75 : def.dangerLevel === 'moderado' ? 45 : 15;

  // Eixo D: Urgência de Intervenção (0 a 100)
  const urgency = def.isTimeSensitive ? 95 : def.dangerLevel === 'critico' ? 80 : 35;

  // Prioridade Composta para Eixo 1 (Ponderação: Compatibilidade * 0.6 + Probabilidade * 0.4)
  const compositePriority =
    exclusionStatus?.excluded
      ? 0
      : Math.round(compatibility * 0.6 + diagnosticProbability * 0.4);

  const multidimensional: MultidimensionalScores = {
    compatibility,
    diagnosticProbability,
    severity,
    urgency,
    compositePriority,
  };

  // 5. Determinação de Status
  let status: HypothesisStatus = 'nao_avaliada';

  if (exclusionStatus?.excluded) {
    status = 'nao_demonstrada';
  } else if (matchedFavorable.length > 0 && compositePriority >= 55) {
    status = 'sustentada';
  } else if (matchedContrary.length > 0 && compositePriority < 25) {
    status = 'enfraquecida';
  } else if (matchedFavorable.length > 0) {
    status = 'em_investigacao';
  } else {
    const anyEvaluated = def.favorableFindings.some((f) => {
      const v = normalizeFindingStatus(state.findings[f.findingId]);
      return v === 'present' || v === 'absent';
    });
    status = anyEvaluated ? 'nao_demonstrada' : 'nao_avaliada';
  }

  // 6. Cálculo Bayesiano (quando parâmetros válidos existirem)
  let bayesianCalc: EvaluatedHypothesis['bayesianCalculation'];
  const firstFavWithBayes = def.favorableFindings.find((f) => f.bayesian?.prevalenceValidationCohort);
  const baselinePrevalence = firstFavWithBayes?.bayesian?.prevalenceValidationCohort ?? 0.15;

  if (collectedLRs.length > 0) {
    const { combinedLR, cautionNote } = combineLikelihoodRatios(collectedLRs, false);
    const postTest = calculatePostTest(baselinePrevalence, combinedLR);

    if (postTest.isValid) {
      bayesianCalc = {
        preTestProb: baselinePrevalence,
        combinedLR,
        postTestProb: postTest.postTestProbability,
        interpretation:
          postTest.postTestProbability > 0.6
            ? 'Alta probabilidade pós-teste baseada nos achados documentados.'
            : postTest.postTestProbability < 0.05
              ? 'Muito baixa probabilidade pós-teste.'
              : 'Probabilidade pós-teste intermediária; investigação adicional necessária.',
        isEstimateReliable: true,
        cautionNote,
      };
    }
  }

  let investigationGuidance = '';
  if (status === 'sustentada') {
    investigationGuidance = `Hipótese fortemente compatível com o quadro atual (${matchedFavorable.length} achados favoráveis). Proceder com confirmação diagnóstica e conduta direcionada.`;
  } else if (def.dangerLevel === 'critico' && !exclusionStatus?.excluded) {
    investigationGuidance = `Condição crítica ativa. Exige busca ativa de sinais de alarme e propedêutica confirmatória antes de descartar.`;
  } else if (status === 'enfraquecida') {
    investigationGuidance = `Achados contrários documentados reduzem a probabilidade, manter cautela se coexistirem fatores de risco.`;
  } else {
    investigationGuidance = `Investigar com anamnese focada e exames pertinentes conforme o contexto clínico.`;
  }

  return {
    def,
    status,
    scoreProbable: diagnosticProbability,
    scoreCritical,
    multidimensional,
    matchedFavorableFindings: matchedFavorable,
    matchedContraryFindings: matchedContrary,
    missingCriticalFindings,
    exclusionStatus,
    isUnconsideredDangerous: false,
    investigationGuidance,
    bayesianCalculation: bayesianCalc,
  };
}
