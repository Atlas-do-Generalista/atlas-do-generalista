import type {
  IDGState,
  FindingStatus,
  ClinicalPresentationId,
  IDGEvaluation,
} from '../types';
import { evaluateIDGState } from '../engine/evaluator';
import { getPatientSession } from '../../patient-state';

/**
 * InMemoryIDGStore — Gerenciador de Estado 100% em Memória para a IDG.
 *
 * PRIVACIDADE E CONFORMIDADE:
 * - Nenhum dado clínico é escrito em localStorage, sessionStorage, IndexedDB ou cookies.
 * - Ao recarregar a página ou fechar a aba, todo o estado é destruído.
 * - Nenhuma telemetria ou transmissão de rede é realizada.
 */
export class InMemoryIDGStore {
  private state: IDGState;
  private listeners: Array<(evaluation: IDGEvaluation, state: IDGState) => void> = [];
  private hasInteracted = false;

  constructor(initialPresentations: ClinicalPresentationId[] = []) {
    this.hasInteracted = initialPresentations.length > 0;
    this.state = {
      presentations: initialPresentations,
      freeTextDescription: '',
      userInitialHypotheses: [],
      findings: {},
      testResults: {},
      importedPatientContext: {},
      interactionCount: 0,
      currentTag: '[Inicial]',
    };
  }

  getState(): Readonly<IDGState> {
    return { ...this.state };
  }

  getEvaluation(): IDGEvaluation {
    return evaluateIDGState(this.state);
  }

  initializeCase(init: Partial<IDGState>): IDGEvaluation {
    this.state = {
      ...this.state,
      ...init,
      currentTag: '[Inicial]',
    };
    this.hasInteracted = true;
    const evaluation = evaluateIDGState(this.state);
    this.notify();
    return evaluation;
  }

  subscribe(listener: (evaluation: IDGEvaluation, state: IDGState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getEvaluation(), this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const evaluation = this.getEvaluation();
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(evaluation, currentState);
      } catch (err) {
        console.error('[IDG InMemoryStore] Erro ao notificar ouvinte:', err);
      }
    }
  }

  setPresentations(presentations: ClinicalPresentationId[]): void {
    this.state.presentations = [...presentations];
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  togglePresentation(presentationId: ClinicalPresentationId): void {
    if (this.state.presentations.includes(presentationId)) {
      this.state.presentations = this.state.presentations.filter((p) => p !== presentationId);
    } else {
      this.state.presentations.push(presentationId);
    }
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  setFreeTextDescription(description: string): void {
    this.state.freeTextDescription = description;
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  setUserInitialHypotheses(hypotheses: string[]): void {
    this.state.userInitialHypotheses = [...hypotheses];
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  setPatientDemographics(patch: { sexo?: string; idade?: number }): void {
    const context = { ...(this.state.importedPatientContext || {}) };
    if (patch.sexo !== undefined) {
      if (patch.sexo) context.sexo = patch.sexo;
      else delete context.sexo;
    }
    if (patch.idade !== undefined) {
      if (Number.isFinite(patch.idade) && patch.idade >= 0) context.idade = patch.idade;
      else delete context.idade;
    }
    this.state.importedPatientContext = context;
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  setFinding(findingId: string, status: FindingStatus): void {
    this.state.findings = {
      ...this.state.findings,
      [findingId]: status,
    };
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  batchSetFindings(patch: Record<string, FindingStatus>): void {
    this.state.findings = {
      ...this.state.findings,
      ...patch,
    };
    this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
    this.hasInteracted = true;
    this.notify();
  }

  setTestResult(testId: string, result: string): void {
    const nextResults = { ...this.state.testResults };
    const normalizedResult = result.trim();
    if (normalizedResult) nextResults[testId] = normalizedResult;
    else delete nextResults[testId];
    this.state.testResults = nextResults;
    this.state.currentTag = normalizedResult ? '[Resultado]' : '[Atualizado]';
    this.hasInteracted = true;
    this.notify();
  }

  recordReassessment(timeOverride?: string): IDGEvaluation {
    const now = new Date();
    const hhmm = timeOverride || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.state.currentTag = `[Reavaliação - ${hhmm}]`;
    const evaluation = evaluateIDGState(this.state);
    this.notify();
    return evaluation;
  }

  /**
   * Importa sob ação explícita do médico os dados gerais do ContextoPaciente
   * existentes no navegador para alimentar a IDG EM MEMÓRIA, sem reescrever
   * nenhum dado da investigação na sessão do navegador.
   */
  importContextoPaciente(): { importedCount: number } {
    try {
      const session = getPatientSession();
      if (!session || !session.general) {
        return { importedCount: 0 };
      }

      this.state.importedPatientContext = { ...session.general };
      this.state.currentTag = this.hasInteracted ? '[Atualizado]' : '[Inicial]';
      this.hasInteracted = true;

      // Se houver dados vitais ou laboratoriais, converte para achados da IDG em memória
      const general = session.general as Record<string, any>;
      const findingsPatch: Record<string, FindingStatus> = {};

      if (typeof general.fc === 'number' && general.fc > 100) {
        findingsPatch['taquicardia_fc_maior_100'] = 'presente';
      }
      if (typeof general.lactato === 'number' && general.lactato > 2.0) {
        findingsPatch['lactato_serico_elevado'] = 'presente';
      }
      if (typeof general.spo2 === 'number' && general.spo2 < 90) {
        findingsPatch['hipoxemia_grave'] = 'presente';
      }

      if (Object.keys(findingsPatch).length > 0) {
        this.state.findings = {
          ...this.state.findings,
          ...findingsPatch,
        };
      }

      this.notify();
      return { importedCount: Object.keys(general).length };
    } catch {
      return { importedCount: 0 };
    }
  }

  /**
   * Descarta e reinicializa completamente todo o estado em memória.
   */
  reset(): void {
    this.hasInteracted = false;
    this.state = {
      presentations: [],
      freeTextDescription: '',
      userInitialHypotheses: [],
      findings: {},
      testResults: {},
      importedPatientContext: {},
    };
    this.notify();
  }
}
