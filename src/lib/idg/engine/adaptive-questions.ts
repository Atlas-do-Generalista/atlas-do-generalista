import type {
  IDGState,
  DiagnosticQuestionDef,
  EvaluatedHypothesis,
} from '../types';
import { IDGKnowledgeRegistry } from '../knowledge/registry';

export function selectAdaptiveQuestions(
  state: IDGState,
  axis1: EvaluatedHypothesis[],
  axis2: EvaluatedHypothesis[],
): DiagnosticQuestionDef[] {
  // Coleta as hipóteses prioritárias em jogo
  const activeHypothesisIds = new Set<string>();

  // Top 3 do Eixo 1
  axis1.slice(0, 3).forEach((h) => activeHypothesisIds.add(h.def.id));
  // Todas as não excluídas do Eixo 2
  axis2.forEach((h) => activeHypothesisIds.add(h.def.id));

  const candidateQuestions = IDGKnowledgeRegistry.getQuestionsForHypotheses(
    Array.from(activeHypothesisIds),
  );

  // Filtra perguntas já respondidas pelo médico
  const unansweredQuestions = candidateQuestions.filter((q) => {
    const val = state.findings[q.targetFindingId];
    return !val || val === 'desconhecido' || val === 'nao_avaliado';
  });

  // Ordena por prioridade intrínseca e poder de discriminação
  return unansweredQuestions.sort((a, b) => {
    // 1. Prioridade crítica primeiro
    const priorityWeight = { critica: 3, alta: 2, moderada: 1 };
    const diffPriority = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diffPriority !== 0) return diffPriority;

    // 2. Número de hipóteses ativas discriminadas
    const countA = a.discriminatesBetween.filter((id) => activeHypothesisIds.has(id)).length;
    const countB = b.discriminatesBetween.filter((id) => activeHypothesisIds.has(id)).length;
    return countB - countA;
  });
}
