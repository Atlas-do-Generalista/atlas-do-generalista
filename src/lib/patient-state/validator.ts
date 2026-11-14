import { CURRENT_SCHEMA_VERSION, type PatientSessionState } from './types';

export function createEmptyPatientSession(): PatientSessionState {
  const agora = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: agora,
    updatedAt: agora,
    general: {},
    obstetric: {},
    pediatric: {},
    specificAssessments: {},
    mentalState: {},
  };
}

export function validateAndSanitizeSessionState(raw: unknown): PatientSessionState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createEmptyPatientSession();
  }

  const obj = raw as Record<string, unknown>;

  // Se a versão do esquema for diferente da atual, inicializa sessão limpa
  // (no futuro, funções de migração incremental seriam acionadas aqui)
  if (obj.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return createEmptyPatientSession();
  }

  const sessionId = typeof obj.sessionId === 'string' && obj.sessionId.trim() !== ''
    ? obj.sessionId
    : `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const createdAt = typeof obj.createdAt === 'string' && !Number.isNaN(Date.parse(obj.createdAt))
    ? obj.createdAt
    : new Date().toISOString();

  const updatedAt = typeof obj.updatedAt === 'string' && !Number.isNaN(Date.parse(obj.updatedAt))
    ? obj.updatedAt
    : new Date().toISOString();

  const general = obj.general && typeof obj.general === 'object' && !Array.isArray(obj.general)
    ? (obj.general as Record<string, unknown>)
    : {};

  const obstetric = obj.obstetric && typeof obj.obstetric === 'object' && !Array.isArray(obj.obstetric)
    ? (obj.obstetric as Record<string, unknown>)
    : {};

  const pediatric = obj.pediatric && typeof obj.pediatric === 'object' && !Array.isArray(obj.pediatric)
    ? (obj.pediatric as Record<string, unknown>)
    : {};

  const specificAssessments = obj.specificAssessments && typeof obj.specificAssessments === 'object' && !Array.isArray(obj.specificAssessments)
    ? (obj.specificAssessments as Record<string, unknown>)
    : {};

  const mentalState = obj.mentalState && typeof obj.mentalState === 'object' && !Array.isArray(obj.mentalState)
    ? (obj.mentalState as Record<string, unknown>)
    : {};

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sessionId,
    createdAt,
    updatedAt,
    general,
    obstetric,
    pediatric,
    specificAssessments,
    mentalState,
  };
}
