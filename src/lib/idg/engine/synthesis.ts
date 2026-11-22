import type {
  IDGState,
  DiagnosticSynthesis,
  EvaluatedHypothesis,
  ClinicalSafetyAlert,
  DiagnosticTestDef,
  ProblemGroupIntegration,
  SOAPTag,
} from '../types';
import { normalizeFindingStatus } from '../types';
import { IDGKnowledgeRegistry } from '../knowledge/registry';
import { composeSOAPSummary } from './soap-composer';
import { analyzeProblemGroups } from './cross-synthesis';

export function generateSynthesis(
  state: IDGState,
  axis1: EvaluatedHypothesis[],
  axis2: EvaluatedHypothesis[],
  alerts: ClinicalSafetyAlert[],
  tests: DiagnosticTestDef[],
  problemIntegration?: ProblemGroupIntegration,
  tag: SOAPTag = '[Inicial]',
): DiagnosticSynthesis {
  // Apresentações
  const presentationLabels = state.presentations.map((pid) => {
    const def = IDGKnowledgeRegistry.getPresentation(pid);
    return def ? def.label : pid;
  });

  // Achados positivos e negativos
  const positiveFindings: string[] = [];
  const negativeFindings: string[] = [];

  const allHypotheses = IDGKnowledgeRegistry.getAllHypotheses();
  const findingLabelMap = new Map<string, string>();
  for (const h of allHypotheses) {
    for (const f of h.favorableFindings) {
      findingLabelMap.set(f.findingId, f.findingLabel);
    }
    for (const c of h.contraryFindings) {
      findingLabelMap.set(c.findingId, c.findingLabel);
    }
  }

  for (const [findingId, rawStatus] of Object.entries(state.findings)) {
    const label = findingLabelMap.get(findingId) || findingId;
    const norm = normalizeFindingStatus(rawStatus);
    if (norm === 'present') positiveFindings.push(label);
    else if (norm === 'absent') negativeFindings.push(label);
  }

  // Hipóteses sustentadas
  const sustained = axis1
    .filter((h) => h.status === 'sustentada')
    .map((h) => ({
      name: h.def.name,
      rationale: `${h.matchedFavorableFindings.length} achados favoráveis documentados. ${h.investigationGuidance}`,
    }));

  // Diagnósticos perigosos ainda não excluídos
  const unruledOutDangerous = axis2
    .filter((h) => !h.exclusionStatus?.excluded)
    .map((h) => {
      const pendingExclusion = h.def.exclusionCriteria.map((e) => e.description).join(' OU ');
      return {
        name: h.def.name,
        dangerLevel: h.def.dangerLevel,
        whyNotExcluded: `Não há exame ou critério confirmatório/excludente definitivo registrado. ${h.missingCriticalFindings.length > 0 ? `Achados pendentes: ${h.missingCriticalFindings.slice(0, 2).join(', ')}.` : ''}`,
        nextStep: pendingExclusion || 'Avaliação clínica seriada e exames complementares urgentes.',
      };
    });

  // Hipóteses enfraquecidas ou não demonstradas
  const weakenedOrUnproven = axis1
    .filter((h) => h.status === 'enfraquecida' || (h.status === 'nao_demonstrada' && h.exclusionStatus?.excluded))
    .map((h) => ({
      name: h.def.name,
      status: h.status,
      reason: h.exclusionStatus?.reason
        ? `Exclusão relativa/formal: ${h.exclusionStatus.reason}`
        : `${h.matchedContraryFindings.length} achados contrários documentados.`,
    }));

  // Ações urgentes geradas pelos alertas
  const urgentActions = alerts.map((a) => `${a.title}: ${a.immediateActionRequired}`);

  // Exames recomendados prioritários
  const recommendedTests = tests.slice(0, 4).map((t) => ({
    testName: t.name,
    rationale: `Investiga: ${t.targetHypothesisIds.join(', ')}. ${t.canExclude ? 'Pode afastar a suspeita.' : 'Não exclui a doença se negativo.'}`,
    caveats: t.limitations,
  }));

  // Limitações da investigação
  const limitations: string[] = [
    'A ausência de informação ou exame não realizado NUNCA equivale a resultado negativo.',
    'Escores e modelos bayesianos representam apoio estatístico e não substituem o julgamento clínico beira-leito.',
  ];

  if (unruledOutDangerous.length > 0) {
    limitations.push(
      `Existem ${unruledOutDangerous.length} hipótese(s) de alto risco clínico que não foram formalmente excluídas.`,
    );
  }

  const effectiveIntegration = problemIntegration ?? analyzeProblemGroups(state);

  // Síntese SOAP estruturada obrigatória
  const soap = composeSOAPSummary(
    state,
    axis1,
    axis2,
    effectiveIntegration,
    alerts,
    tests,
    tag,
  );

  return {
    initialPresentations: presentationLabels,
    freeTextSummary: state.freeTextDescription || 'Sem anotações textuais adicionais.',
    relevantPositiveFindings: positiveFindings,
    relevantNegativeFindings: negativeFindings,
    sustainedHypotheses: sustained,
    unruledOutDangerousHypotheses: unruledOutDangerous,
    weakenedOrUnprovenHypotheses: weakenedOrUnproven,
    urgentActionItems: urgentActions,
    recommendedTests,
    investigationLimitations: limitations,
    disclaimer:
      'Investigação Diagnóstica Guiada (IDG) — Atlas do Generalista. Ferramenta de apoio cognitivo para redução de viés de fechamento prematuro. Processamento 100% local em memória. Não persistido em navegador.',
    soap,
  };
}
