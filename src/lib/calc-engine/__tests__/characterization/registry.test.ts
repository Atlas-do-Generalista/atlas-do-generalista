import { describe, it, expect } from 'vitest';
import { registry } from '../../registry';

describe('Registro Central do Motor de Decisão Clínica', () => {
  it('deve conter exatamente 33 calculadoras registradas', () => {
    expect(registry).toHaveLength(33);
  });

  it('deve ter identificadores únicos para todas as calculadoras', () => {
    const ids = registry.map((calc) => calc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(33);
  });

  it('deve preservar a ordem canônica estabelecida no registry', () => {
    const idsEsperados = [
      // Antropometria (5)
      'imc',
      'superficie-corporal',
      'peso-ideal',
      'peso-ajustado',
      'peso-predito',
      // Sinais vitais, gravidade geral e hemodinâmica (7)
      'news2',
      'qsofa',
      'sofa-2',
      'apache-ii',
      'pam',
      'pressao-pulso',
      'shock-index',
      // Função renal (4)
      'ckd-epi-2021',
      'cockcroft-gault',
      'fena',
      'fe-ureia',
      // Função hepática (3)
      'child-pugh',
      'meld-3',
      'albi',
      // Gasometria e Ácido-Base (1)
      'analise-gasometria',
      // Laboratório / metabólico / hidroeletrolítico (8)
      'osmolaridade-plasmatica',
      'osmolaridade-efetiva',
      'anion-gap',
      'anion-gap-albumina',
      'delta-gap',
      'sodio-corrigido-glicemia',
      'calcio-corrigido',
      'deficit-agua-livre',
      // Risco e profilaxia (2)
      'rcri',
      'padua',
      // Avaliações neurológicas e específicas (3)
      'hiss',
      'ciwa-ar',
      'cows',
    ];

    expect(registry.map((c) => c.id)).toEqual(idsEsperados);
  });

  it('cada calculadora deve implementar o contrato Calculadora', () => {
    for (const calc of registry) {
      expect(typeof calc.id).toBe('string');
      expect(typeof calc.nome).toBe('string');
      expect(typeof calc.categoria).toBe('string');
      expect(Array.isArray(calc.entradas)).toBe(true);
      expect(typeof calc.calcular).toBe('function');
      expect(typeof calc.populacaoAlvo).toBe('string');
      expect(Array.isArray(calc.referencias)).toBe(true);
      expect(calc.referencias.length).toBeGreaterThan(0);
      expect(typeof calc.versao).toBe('string');
      expect(typeof calc.ultimaRevisao).toBe('string');
    }
  });
});
