/**
 * Investigação Diagnóstica Guiada (IDG) — Contratos e Tipos Centrais
 * Atlas do Generalista
 *
 * Princípio Arquitetural:
 * Complexidade no raciocínio (motor), simplicidade radical na apresentação (interface),
 * rigor epistêmico absoluto (segurança clínica).
 */

export type FindingStatus =
  | 'present'
  | 'absent'
  | 'unknown'
  | 'not_assessed'
  | 'not_applicable'
  | 'presente'
  | 'ausente'
  | 'desconhecido'
  | 'nao_avaliado'
  | 'nao_aplicavel';

export type NormalizedFindingStatus =
  | 'present'
  | 'absent'
  | 'unknown'
  | 'not_assessed'
  | 'not_applicable';

export function normalizeFindingStatus(status: FindingStatus | string | undefined): NormalizedFindingStatus {
  if (status === 'present' || status === 'presente') return 'present';
  if (status === 'absent' || status === 'ausente') return 'absent';
  if (status === 'unknown' || status === 'desconhecido') return 'unknown';
  if (status === 'not_applicable' || status === 'nao_aplicavel') return 'not_applicable';
  return 'not_assessed';
}

export type HypothesisStatus =
  | 'nao_avaliada'
  | 'em_investigacao'
  | 'sustentada'
  | 'enfraquecida'
  | 'nao_demonstrada'
  | 'confirmada';

export type HypothesisCategory =
  | 'condicao_grave'
  | 'comum'
  | 'alternativa'
  | 'imitador';

export type DangerLevel = 'critico' | 'alto' | 'moderado' | 'baixo';

export type ClinicalPresentationId =
  | 'dor_toracica'
  | 'dor_abdominal'
  | 'obstipacao'
  | 'dispneia'
  | 'febre'
  | 'alteracao_consciencia'
  | 'deficit_neurologico'
  | 'cefaleia_aguda'
  | 'sincope'
  | 'sangramento'
  | 'dor_vertebral'
  | 'choque'
  | 'palpitacoes';

export interface ClinicalPresentationDef {
  id: ClinicalPresentationId;
  label: string;
  icon: string;
  description: string;
  primaryDangerousHypothesisIds: string[];
}

export interface ClinicalFindingRef {
  id: string;
  label: string;
  category: 'anamnese' | 'exame_fisico' | 'laboratorio' | 'imagem' | 'eletro';
  description?: string;
}

export interface BayesianEvidence {
  prevalenceValidationCohort?: number; // Prevalência na população de validação
  sensitivity?: number; // 0.0 a 1.0
  specificity?: number; // 0.0 a 1.0
  lrPositive?: number; // Razão de verossimilhança positiva
  lrNegative?: number; // Razão de verossimilhança negativa
  confidenceInterval95?: {
    lrPos?: [number, number];
    lrNeg?: [number, number];
  };
  validationPopulation: string;
  sourceReference: string;
  clinicalNotes?: string;
}

export interface DiagnosticFindingAssociation {
  findingId: string;
  findingLabel: string;
  expectedState: 'present' | 'absent' | 'presente' | 'ausente';
  impact: 'forte_favoravel' | 'moderado_favoravel' | 'fraco_favoravel' | 'forte_contrario' | 'moderado_contrario';
  rationale: string;
  bayesian?: BayesianEvidence;
}

export interface ExclusionCriterion {
  id: string;
  description: string;
  requiresFindingId: string;
  requiresFindingState: 'present' | 'absent' | 'presente' | 'ausente';
  isDefinitive: boolean;
  caveats: string;
}

export interface ClinicalHypothesisDef {
  id: string;
  name: string;
  presentationId: ClinicalPresentationId;
  category: HypothesisCategory;
  dangerLevel: DangerLevel;
  isTimeSensitive: boolean;
  timeWindowDescription?: string;
  summaryRationale: string;
  riskFactors: string[];
  redFlags: string[];
  favorableFindings: DiagnosticFindingAssociation[];
  contraryFindings: DiagnosticFindingAssociation[];
  exclusionCriteria: ExclusionCriterion[];
  relevantQuestionIds: string[];
  relevantTestIds: string[];
  clinicalReferences: string[];
  version: string;
  lastReviewed: string;
  reviewer: string;
  knownLimitations: string;
}

export interface DiagnosticQuestionDef {
  id: string;
  text: string;
  targetFindingId: string;
  clinicalUtility: string;
  discriminatesBetween: string[];
  category: 'sintoma' | 'antecedente' | 'sinal_alarme' | 'exame_fisico';
  priority: 'critica' | 'alta' | 'moderada';
}

export interface DiagnosticTestDef {
  id: string;
  name: string;
  targetHypothesisIds: string[];
  relevantFindingsProvided: string[];
  limitations: string;
  falseNegativeRisk: string;
  contraindications: string;
  canExclude: boolean;
  exclusionRationale: string;
  priority: 'emergencial' | 'urgente' | 'ambulatorial_ou_internacao';
  reference: string;
}

export interface ClinicalSafetyAlert {
  id: string;
  severity: 'critica' | 'alta' | 'moderada';
  title: string;
  description: string;
  relatedHypothesisId?: string;
  triggeredByFindings: string[];
  immediateActionRequired: string;
  ruleReference: string;
}

export interface ScoreAdapterResult {
  scoreId: string;
  scoreName: string;
  targetHypotheses: string[];
  status: 'ok' | 'incompleto' | 'erro';
  value?: number | string;
  summary?: string;
  missingFields?: string[];
  clinicalInterpretation: string;
  limitations: string;
  validationPopulation: string;
  reference: string;
}

export interface MultidimensionalScores {
  compatibility: number; // 0 a 100: compatibilidade com achados atuais
  diagnosticProbability: number; // 0 a 100: probabilidade pré-teste/clínica
  severity: number; // 0 a 100: gravidade potencial (letalidade/morbidade)
  urgency: number; // 0 a 100: urgência de intervenção
  compositePriority: number; // Score final de ordenação ponderado
}

export interface EvaluatedHypothesis {
  def: ClinicalHypothesisDef;
  status: HypothesisStatus;
  scoreProbable: number;
  scoreCritical: number;
  multidimensional: MultidimensionalScores;
  matchedFavorableFindings: Array<{ association: DiagnosticFindingAssociation; findingValue: FindingStatus }>;
  matchedContraryFindings: Array<{ association: DiagnosticFindingAssociation; findingValue: FindingStatus }>;
  missingCriticalFindings: string[];
  exclusionStatus?: {
    excluded: boolean;
    reason?: string;
    caveats?: string;
  };
  isUnconsideredDangerous: boolean;
  investigationGuidance: string;
  bayesianCalculation?: {
    preTestProb: number;
    combinedLR: number;
    postTestProb: number;
    interpretation: string;
    isEstimateReliable: boolean;
    cautionNote: string;
  };
}

export interface ProblemGroupIntegration {
  problemA: string;
  problemB: string;
  problemCUnifier: string;
  sharedHypotheses: string[];
  clinicalRationale: string;
}

export type SOAPTag = '[Inicial]' | '[Atualizado]' | `[Reavaliação - ${string}]` | '[Resultado]';

export interface SOAPOutput {
  versionTag: SOAPTag;
  timestamp: string;
  subjective: string;
  objective: {
    vitalSigns: string;
    physicalExam: string;
    availableTests: string;
  };
  assessment: {
    unifyingSynthesis: string;
    priorityDifferentials: Array<{
      name: string;
      oneLineRationale: string;
      severityTag?: string;
    }>;
    unruledOutDangerous: Array<{
      name: string;
      whatIsMissingToExclude: string;
    }>;
    uncertaintyDegree: string;
    criticalGaps: string[];
  };
  plan: {
    immediate: string[];
    investigation: string[];
    therapeuticsToConsider: string[];
    reassessmentAndAlerts: string[];
  };
  formattedMarkdown: string;
}

export interface IDGState {
  presentations: ClinicalPresentationId[];
  freeTextDescription: string;
  userInitialHypotheses: string[];
  findings: Record<string, FindingStatus>;
  testResults: Record<string, string>;
  importedPatientContext: Record<string, unknown>;
  soapHistory?: Array<{ tag: SOAPTag; timestamp: string; markdown: string }>;
  interactionCount?: number;
  currentTag?: SOAPTag;
}

export interface DiagnosticSynthesis {
  initialPresentations: string[];
  freeTextSummary: string;
  relevantPositiveFindings: string[];
  relevantNegativeFindings: string[];
  sustainedHypotheses: Array<{ name: string; rationale: string }>;
  unruledOutDangerousHypotheses: Array<{ name: string; dangerLevel: DangerLevel; whyNotExcluded: string; nextStep: string }>;
  weakenedOrUnprovenHypotheses: Array<{ name: string; status: HypothesisStatus; reason: string }>;
  urgentActionItems: string[];
  recommendedTests: Array<{ testName: string; rationale: string; caveats: string }>;
  investigationLimitations: string[];
  disclaimer: string;
  soap: SOAPOutput;
}

export interface IDGEvaluation {
  axis1Probable: EvaluatedHypothesis[];
  axis2Critical: EvaluatedHypothesis[];
  unconsideredDangerous: EvaluatedHypothesis[];
  problemIntegration?: ProblemGroupIntegration;
  activeSafetyAlerts: ClinicalSafetyAlert[];
  suggestedQuestions: DiagnosticQuestionDef[];
  suggestedTests: DiagnosticTestDef[];
  integratedScores: ScoreAdapterResult[];
  synthesis: DiagnosticSynthesis;
  soap: SOAPOutput;
}
