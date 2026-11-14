/**
 * Camada 1: Patient State (Armazenamento e Compartilhamento de Dados)
 *
 * Contratos de tipos para o estado da sessão clínica compartilhada.
 * O esquema é versionado para permitir migrações seguras entre versões do aplicativo.
 */

export const CURRENT_SCHEMA_VERSION = 1;
export const PATIENT_SESSION_STORAGE_KEY = 'atlas_generalista_patient_session_v1';
export const PATIENT_STATE_CHANGE_EVENT = 'atlas:patient-state-change';

export interface DadosObstetricos {
  dum?: string;
  dumConfiavel?: boolean | null;
  usgData?: string;
  usgIgSemanas?: number | null;
  usgIgDias?: number | null;
  igPreferencia?: 'auto' | 'dum' | 'usg';
  alturaCm?: number | null;
  pesoPreGestacionalKg?: number | null;
  pesoAtualKg?: number | null;
  pas?: number | null;
  pad?: number | null;
  [campo: string]: unknown;
}

export interface DadosPediatricos {
  idadeAnos?: number | null;
  idadeMeses?: number | null;
  idadeDias?: number | null;
  sexo?: 'feminino' | 'masculino' | 'outro';
  pesoKg?: number | null;
  estaturaCm?: number | null;
  perimetroCefalicoCm?: number | null;
  fc?: number | null;
  fr?: number | null;
  pas?: number | null;
  pad?: number | null;
  temperatura?: number | null;
  spo2?: number | null;
  pesoNascerGramas?: number | null;
  estaturaNascerCm?: number | null;
  apgar1Minuto?: number | null;
  apgar5Minutos?: number | null;
  idadeGestacionalSemanas?: number | null;
  tipoParto?: 'vaginal' | 'cesariana' | 'outro';
  alimentacao?: 'aleitamento_exclusivo' | 'aleitamento_predominante' | 'misto' | 'formula' | 'alimentacao_complementar' | 'dieta_familia';
  vacinacaoEmDia?: boolean | null;
  marcosDesenvolvimento?: Record<string, boolean>;
  antecedentesPerinataisNotas?: string;
  [campo: string]: unknown;
}

export interface AvaliacoesEspecificas {
  rcri?: Record<string, unknown>;
  padua?: Record<string, unknown>;
  ciwa?: Record<string, unknown>;
  cows?: Record<string, unknown>;
  hiss?: Record<string, unknown>;
  sindromeSelecionada?: string;
  [sindromeOuEscore: string]: unknown;
}

export interface EstadoMentalState {
  achadosSelecionados?: Record<string, string | string[]>;
  textoGerado?: string;
  sumulaFormatada?: string;
  atualizadoEm?: string;
}

export interface PatientSessionState {
  schemaVersion: number;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  /** Dados clínicos gerais do paciente (compatíveis com ContextoPaciente) */
  general: Record<string, unknown>;
  /** Dados específicos obstétricos / pré-natal */
  obstetric: DadosObstetricos;
  /** Dados do contexto pediátrico e puericultura */
  pediatric: DadosPediatricos;
  /** Avaliações direcionadas por síndromes e escores específicos */
  specificAssessments: AvaliacoesEspecificas;
  /** Avaliação estruturada do exame do estado mental */
  mentalState: EstadoMentalState;
}
