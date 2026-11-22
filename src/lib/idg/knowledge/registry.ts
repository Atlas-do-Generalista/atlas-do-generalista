import type {
  ClinicalPresentationId,
  ClinicalPresentationDef,
  ClinicalHypothesisDef,
  DiagnosticQuestionDef,
  DiagnosticTestDef,
  ClinicalSafetyAlert,
} from '../types';

import { CLINICAL_PRESENTATIONS } from './presentations';
import {
  HYPOTHESES_DOR_TORACICA,
  QUESTIONS_DOR_TORACICA,
  TESTS_DOR_TORACICA,
  SAFETY_ALERTS_DOR_TORACICA,
} from './modules/dor-toracica';
import {
  HYPOTHESES_DOR_VERTEBRAL,
  QUESTIONS_DOR_VERTEBRAL,
  TESTS_DOR_VERTEBRAL,
  SAFETY_ALERTS_DOR_VERTEBRAL,
} from './modules/dor-vertebral';
import {
  HYPOTHESES_DOR_ABDOMINAL,
  QUESTIONS_DOR_ABDOMINAL,
  TESTS_DOR_ABDOMINAL,
  SAFETY_ALERTS_DOR_ABDOMINAL,
} from './modules/dor-abdominal';
import {
  HYPOTHESES_SUSPEITA_INFECCAO,
  QUESTIONS_SUSPEITA_INFECCAO,
  TESTS_SUSPEITA_INFECCAO,
  SAFETY_ALERTS_SUSPEITA_INFECCAO,
} from './modules/suspeita-infeccao';

export interface KnowledgeModuleMetadata {
  id: string;
  title: string;
  presentationId: ClinicalPresentationId;
  version: string;
  reviewer: string;
  reviewedAt: string;
  referencesCount: number;
}

export class IDGKnowledgeRegistry {
  private static presentations = CLINICAL_PRESENTATIONS;

  private static hypotheses: ClinicalHypothesisDef[] = [
    ...HYPOTHESES_DOR_TORACICA,
    ...HYPOTHESES_DOR_VERTEBRAL,
    ...HYPOTHESES_DOR_ABDOMINAL,
    ...HYPOTHESES_SUSPEITA_INFECCAO,
  ];

  private static questions: DiagnosticQuestionDef[] = [
    ...QUESTIONS_DOR_TORACICA,
    ...QUESTIONS_DOR_VERTEBRAL,
    ...QUESTIONS_DOR_ABDOMINAL,
    ...QUESTIONS_SUSPEITA_INFECCAO,
  ];

  private static tests: DiagnosticTestDef[] = [
    ...TESTS_DOR_TORACICA,
    ...TESTS_DOR_VERTEBRAL,
    ...TESTS_DOR_ABDOMINAL,
    ...TESTS_SUSPEITA_INFECCAO,
  ];

  private static alerts: ClinicalSafetyAlert[] = [
    ...SAFETY_ALERTS_DOR_TORACICA,
    ...SAFETY_ALERTS_DOR_VERTEBRAL,
    ...SAFETY_ALERTS_DOR_ABDOMINAL,
    ...SAFETY_ALERTS_SUSPEITA_INFECCAO,
  ];

  static getAllPresentations(): ClinicalPresentationDef[] {
    return Object.values(this.presentations);
  }

  static getPresentation(id: ClinicalPresentationId): ClinicalPresentationDef | undefined {
    return this.presentations[id];
  }

  static getAllHypotheses(): ClinicalHypothesisDef[] {
    return [...this.hypotheses];
  }

  static getHypothesisById(id: string): ClinicalHypothesisDef | undefined {
    return this.hypotheses.find((h) => h.id === id);
  }

  static findHypothesesByNames(names: string[]): ClinicalHypothesisDef[] {
    const normalize = (value: string) =>
      value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    const aliases: Record<string, string[]> = {
      infarto: ['sca'],
      iam: ['sca'],
      'infarto agudo do miocardio': ['sca'],
      'sindrome coronariana aguda': ['sca'],
      'embolia pulmonar': ['tep'],
      'tromboembolismo pulmonar': ['tep'],
      'disseccao de aorta': ['disseccao_aorta'],
      'disseccao aortica': ['disseccao_aorta'],
    };

    const queries = names
      .map((name) => normalize(name))
      .filter(Boolean)
      .flatMap((query) => [query, ...(aliases[query] || []).map(normalize)]);

    const matched = new Set<string>();
    for (const query of queries) {
      for (const hypothesis of this.hypotheses) {
        const id = normalize(hypothesis.id.replace(/_/g, ' '));
        const name = normalize(hypothesis.name);
        const exact = id === query || name === query;
        const phraseMatch = query.length >= 5 && name.includes(query);
        if (exact || phraseMatch) matched.add(hypothesis.id);
      }
    }
    return this.hypotheses.filter((hypothesis) => matched.has(hypothesis.id));
  }

  static getHypothesesForPresentations(
    presentations: ClinicalPresentationId[],
    extraHypothesisIds: string[] = [],
    extraHypothesisNames: string[] = [],
  ): ClinicalHypothesisDef[] {
    const set = new Set(presentations);
    const extraSet = new Set(extraHypothesisIds);
    this.findHypothesesByNames(extraHypothesisNames).forEach((h) => extraSet.add(h.id));

    // Obstipação também exige considerar hipóteses cadastradas para abdome agudo.
    if (set.has('obstipacao')) set.add('dor_abdominal');

    return this.hypotheses.filter(
      (h) => set.has(h.presentationId) || extraSet.has(h.id),
    );
  }

  static getAllQuestions(): DiagnosticQuestionDef[] {
    return [...this.questions];
  }

  static getQuestionsForHypotheses(hypothesisIds: string[]): DiagnosticQuestionDef[] {
    const hypSet = new Set(hypothesisIds);
    return this.questions.filter((q) =>
      q.discriminatesBetween.some((id) => hypSet.has(id)),
    );
  }

  static getAllTests(): DiagnosticTestDef[] {
    return [...this.tests];
  }

  static getTestsForHypotheses(hypothesisIds: string[]): DiagnosticTestDef[] {
    const hypSet = new Set(hypothesisIds);
    return this.tests.filter((t) =>
      t.targetHypothesisIds.some((id) => hypSet.has(id)),
    );
  }

  static getAllAlerts(): ClinicalSafetyAlert[] {
    return [...this.alerts];
  }

  static getModulesMetadata(): KnowledgeModuleMetadata[] {
    return [
      {
        id: 'dor-toracica',
        title: 'Módulo 1: Dor Torácica / Dissecção Aguda de Aorta',
        presentationId: 'dor_toracica',
        version: '1.0.0',
        reviewer: 'Comitê Clínico de Emergências Cardiovasculares',
        reviewedAt: '2026-09-22',
        referencesCount: 6,
      },
      {
        id: 'dor-vertebral',
        title: 'Módulo 2: Dor Vertebral / Compressão Medular Aguda',
        presentationId: 'dor_vertebral',
        version: '1.0.0',
        reviewer: 'Comitê Clínico de Neurologia e Oncologia',
        reviewedAt: '2026-09-22',
        referencesCount: 7,
      },
      {
        id: 'dor-abdominal',
        title: 'Módulo 3: Dor Abdominal / Isquemia Mesentérica Aguda',
        presentationId: 'dor_abdominal',
        version: '1.0.0',
        reviewer: 'Comitê Clínico de Cirurgia do Abdome Agudo e Vascular',
        reviewedAt: '2026-09-22',
        referencesCount: 8,
      },
      {
        id: 'suspeita-infeccao',
        title: 'Módulo 4: Suspeita de Infecção / Sepse Inicial',
        presentationId: 'febre',
        version: '1.0.0',
        reviewer: 'Comitê Clínico de Terapia Intensiva e Infectologia',
        reviewedAt: '2026-09-22',
        referencesCount: 9,
      },
    ];
  }
}
