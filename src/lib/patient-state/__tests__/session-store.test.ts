import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getPatientSession,
  savePatientSession,
  updateGeneralData,
  updateObstetricData,
  updatePediatricData,
  updateSpecificAssessment,
  updateMentalState,
  clearPatientSession,
} from '../session-store';
import { PATIENT_SESSION_STORAGE_KEY, CURRENT_SCHEMA_VERSION } from '../types';

describe('Patient State — Armazenamento e Compartilhamento de Sessão', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    // Mock do sessionStorage no ambiente global do Vitest/Node
    const storageMock = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };

    vi.stubGlobal('sessionStorage', storageMock);
    vi.stubGlobal('window', {
      sessionStorage: storageMock,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve inicializar sessão limpa e versionada quando sessionStorage estiver vazio', () => {
    const session = getPatientSession();
    expect(session.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof session.sessionId).toBe('string');
    expect(session.general).toEqual({});
    expect(session.obstetric).toEqual({});
    expect(session.pediatric).toEqual({});
    expect(session.specificAssessments).toEqual({});
    expect(session.mentalState).toEqual({});
  });

  it('deve persistir dados no sessionStorage e recuperá-los fielmente', () => {
    updateGeneralData({
      idade: 52,
      sexo: 'masculino',
      pas: 130,
      pad: 80,
    });

    const sessionRecuperada = getPatientSession();
    expect(sessionRecuperada.general.idade).toBe(52);
    expect(sessionRecuperada.general.sexo).toBe('masculino');
    expect(sessionRecuperada.general.pas).toBe(130);
  });

  it('deve preservar o isolamento e não sobrescrever outros domínios ao atualizar um domínio específico', () => {
    // 1. Atualiza dados gerais
    updateGeneralData({ fc: 78, temperatura: 36.5 });

    // 2. Atualiza dados obstétricos
    updateObstetricData({ dum: '2026-04-10', dumConfiavel: true });

    // 3. Atualiza dados pediátricos
    updatePediatricData({ idadeMeses: 8, vacinacaoEmDia: true });

    // 4. Atualiza instrumento específico
    updateSpecificAssessment('ciwa', { total: 4 });

    // 5. Atualiza estado mental
    updateMentalState({ textoGerado: 'Paciente vigil e orientado.' });

    const finalState = getPatientSession();

    // Nenhum domínio foi perdido
    expect(finalState.general.fc).toBe(78);
    expect(finalState.obstetric.dum).toBe('2026-04-10');
    expect(finalState.pediatric.idadeMeses).toBe(8);
    expect((finalState.specificAssessments.ciwa as any)?.total).toBe(4);
    expect(finalState.mentalState.textoGerado).toBe('Paciente vigil e orientado.');
  });

  it('deve recuperar-se de JSON corrompido no sessionStorage criando nova sessão válida', () => {
    mockStorage[PATIENT_SESSION_STORAGE_KEY] = '{ formato invalido de json';

    const session = getPatientSession();
    expect(session.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(session.general).toEqual({});
  });

  it('deve reiniciar a sessão de forma segura se a versão do esquema no storage for incompatível', () => {
    const estadoAntigo = {
      schemaVersion: 999, // Versão futura ou incompatível
      sessionId: 'sessao_antiga',
      general: { dadoAntigo: 'teste' },
    };
    mockStorage[PATIENT_SESSION_STORAGE_KEY] = JSON.stringify(estadoAntigo);

    const session = getPatientSession();
    expect(session.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(session.general).toEqual({});
  });

  it('deve permitir limpeza explícita da sessão', () => {
    updateGeneralData({ idade: 40 });
    expect(getPatientSession().general.idade).toBe(40);

    const novaSessao = clearPatientSession();
    expect(novaSessao.general).toEqual({});
    expect(getPatientSession().general).toEqual({});
  });
});
