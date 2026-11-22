import type {
  IDGState,
  DiagnosticTestDef,
  EvaluatedHypothesis,
} from '../types';
import { IDGKnowledgeRegistry } from '../knowledge/registry';

export function recommendDiagnosticTests(
  state: IDGState,
  axis1: EvaluatedHypothesis[],
  axis2: EvaluatedHypothesis[],
): DiagnosticTestDef[] {
  const activeHypothesisIds = new Set<string>();

  // Hipóteses do Eixo 1 que ainda não foram confirmadas nem excluídas
  axis1
    .filter((h) => h.status !== 'confirmada' && !h.exclusionStatus?.excluded)
    .slice(0, 3)
    .forEach((h) => activeHypothesisIds.add(h.def.id));

  // Hipóteses graves do Eixo 2 não excluídas
  axis2
    .filter((h) => !h.exclusionStatus?.excluded)
    .forEach((h) => activeHypothesisIds.add(h.def.id));

  const candidateTests = IDGKnowledgeRegistry.getTestsForHypotheses(
    Array.from(activeHypothesisIds),
  );

  // Evita duplicatas por ID
  const testMap = new Map<string, DiagnosticTestDef>();
  for (const test of candidateTests) {
    if (!testMap.has(test.id)) {
      testMap.set(test.id, test);
    }
  }

  // Ordena por prioridade: emergencial primeiro, depois testes que podem excluir condições graves
  return Array.from(testMap.values()).sort((a, b) => {
    const pWeight = { emergencial: 3, urgente: 2, ambulatorial_ou_internacao: 1 };
    const diff = pWeight[b.priority] - pWeight[a.priority];
    if (diff !== 0) return diff;
    if (b.canExclude && !a.canExclude) return 1;
    if (a.canExclude && !b.canExclude) return -1;
    return 0;
  });
}
