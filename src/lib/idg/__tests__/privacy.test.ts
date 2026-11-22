import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — Privacidade e Isolamento em Memória', () => {
  let mockStorage: Record<string, string> = {};
  let setItemSpy: any;

  beforeEach(() => {
    mockStorage = {};
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

    setItemSpy = vi.spyOn(storageMock, 'setItem');

    vi.stubGlobal('sessionStorage', storageMock);
    vi.stubGlobal('localStorage', storageMock);
    vi.stubGlobal('window', {
      sessionStorage: storageMock,
      localStorage: storageMock,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('não grava nenhum dado clínico em localStorage ou sessionStorage durante a investigação', () => {
    const store = new InMemoryIDGStore(['dor_toracica']);
    store.setFreeTextDescription('Paciente masculino 58 anos com dor torácica lancinante');
    store.setUserInitialHypotheses(['SCA', 'Dor muscular']);
    store.setFinding('dor_subita_intensidade_maxima', 'presente');
    store.setFinding('assimetria_pulsos_ou_pa', 'presente');
    store.setTestResult('angiotc_aorta', 'Normal');

    const evalState = store.getEvaluation();
    expect(evalState.axis1Probable.length).toBeGreaterThan(0);

    // O spy do setItem não deve ter recebido nenhuma chamada gravando os dados da IDG
    const callsWithClinicalData = setItemSpy.mock.calls.filter(([key, val]: [string, string]) => {
      return (
        String(key).includes('idg') ||
        String(val).includes('lancinante') ||
        String(val).includes('dor_subita')
      );
    });

    expect(callsWithClinicalData.length).toBe(0);
  });

  it('destrói completamente o estado da investigação ao executar reset()', () => {
    const store = new InMemoryIDGStore(['dor_toracica']);
    store.setFreeTextDescription('Dados do paciente sensíveis');
    store.setFinding('dor_subita_intensidade_maxima', 'presente');

    expect(store.getState().presentations.length).toBe(1);
    expect(store.getState().freeTextDescription).toBe('Dados do paciente sensíveis');

    store.reset();

    expect(store.getState().presentations.length).toBe(0);
    expect(store.getState().freeTextDescription).toBe('');
    expect(Object.keys(store.getState().findings).length).toBe(0);
  });
});
