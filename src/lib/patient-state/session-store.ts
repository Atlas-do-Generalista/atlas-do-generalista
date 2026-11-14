import {
  PATIENT_SESSION_STORAGE_KEY,
  PATIENT_STATE_CHANGE_EVENT,
  type PatientSessionState,
  type DadosObstetricos,
  type DadosPediatricos,
  type EstadoMentalState,
} from './types';
import { createEmptyPatientSession, validateAndSanitizeSessionState } from './validator';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

let inMemoryFallback: PatientSessionState | null = null;

function notifyChange(state: PatientSessionState): void {
  if (isBrowser()) {
    try {
      window.dispatchEvent(
        new CustomEvent<PatientSessionState>(PATIENT_STATE_CHANGE_EVENT, {
          detail: state,
        }),
      );
    } catch {
      // Ignora falhas silenciosas de dispatch em ambientes restritos
    }
  }
}

/**
 * Recupera o estado atual da sessão do paciente.
 * Seguro para SSR e resistente a dados corrompidos no sessionStorage.
 */
export function getPatientSession(): PatientSessionState {
  if (!isBrowser()) {
    if (!inMemoryFallback) inMemoryFallback = createEmptyPatientSession();
    return inMemoryFallback;
  }

  try {
    const raw = window.sessionStorage.getItem(PATIENT_SESSION_STORAGE_KEY);
    if (!raw) {
      const fresh = createEmptyPatientSession();
      savePatientSession(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    const sanitized = validateAndSanitizeSessionState(parsed);
    return sanitized;
  } catch (error) {
    console.warn('[PatientState] Erro ao recuperar sessão do sessionStorage. Reinicializando.', error);
    const fresh = createEmptyPatientSession();
    savePatientSession(fresh);
    return fresh;
  }
}

/**
 * Salva integralmente o estado da sessão do paciente no sessionStorage.
 */
export function savePatientSession(state: PatientSessionState): void {
  const toSave: PatientSessionState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };

  if (!isBrowser()) {
    inMemoryFallback = toSave;
    return;
  }

  try {
    window.sessionStorage.setItem(PATIENT_SESSION_STORAGE_KEY, JSON.stringify(toSave));
    notifyChange(toSave);
  } catch (error) {
    console.warn('[PatientState] Falha ao persistir no sessionStorage:', error);
  }
}

/**
 * Atualiza os dados clínicos gerais (sinais vitais, demografia, lab, UTI)
 * preservando todas as demais seções da sessão.
 */
export function updateGeneralData(patch: Record<string, unknown>): PatientSessionState {
  const current = getPatientSession();
  const updated: PatientSessionState = {
    ...current,
    general: {
      ...current.general,
      ...patch,
    },
  };
  savePatientSession(updated);
  return updated;
}

/**
 * Atualiza os dados obstétricos / pré-natal preservando os demais domínios.
 */
export function updateObstetricData(patch: Partial<DadosObstetricos>): PatientSessionState {
  const current = getPatientSession();
  const updated: PatientSessionState = {
    ...current,
    obstetric: {
      ...current.obstetric,
      ...patch,
    },
  };
  savePatientSession(updated);
  return updated;
}

/**
 * Atualiza os dados pediátricos / puericultura preservando os demais domínios.
 */
export function updatePediatricData(patch: Partial<DadosPediatricos>): PatientSessionState {
  const current = getPatientSession();
  const updated: PatientSessionState = {
    ...current,
    pediatric: {
      ...current.pediatric,
      ...patch,
    },
  };
  savePatientSession(updated);
  return updated;
}

/**
 * Atualiza um instrumento ou escore específico (ex.: rcri, padua, ciwa, cows, hiss).
 */
export function updateSpecificAssessment(key: string, data: unknown): PatientSessionState {
  const current = getPatientSession();
  const updated: PatientSessionState = {
    ...current,
    specificAssessments: {
      ...current.specificAssessments,
      [key]: data,
    },
  };
  savePatientSession(updated);
  return updated;
}

/**
 * Atualiza os achados e súmula textual do exame do estado mental.
 */
export function updateMentalState(patch: Partial<EstadoMentalState>): PatientSessionState {
  const current = getPatientSession();
  const updated: PatientSessionState = {
    ...current,
    mentalState: {
      ...current.mentalState,
      ...patch,
    },
  };
  savePatientSession(updated);
  return updated;
}

/**
 * Limpa explicitamente a sessão do paciente, gerando uma nova sessão limpa.
 */
export function clearPatientSession(): PatientSessionState {
  const fresh = createEmptyPatientSession();
  if (isBrowser()) {
    try {
      window.sessionStorage.removeItem(PATIENT_SESSION_STORAGE_KEY);
    } catch {
      // Ignora falhas de remoção
    }
  }
  savePatientSession(fresh);
  return fresh;
}

/**
 * Inscreve um listener para ser notificado sempre que o estado da sessão sofrer alteração.
 * Retorna uma função de desinscrição.
 */
export function subscribeToPatientSession(callback: (state: PatientSessionState) => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<PatientSessionState>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getPatientSession());
    }
  };

  window.addEventListener(PATIENT_STATE_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(PATIENT_STATE_CHANGE_EVENT, handler);
  };
}
