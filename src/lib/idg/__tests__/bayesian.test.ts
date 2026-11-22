import { describe, it, expect } from 'vitest';
import {
  probabilityToOdds,
  oddsToProbability,
  calculatePostTest,
  calculatePredictiveValues,
  combineLikelihoodRatios,
} from '../bayesian/calculator';

describe('IDG — Raciocínio Bayesiano e Evidência Diagnóstica', () => {
  describe('Conversões de Probabilidade e Odds', () => {
    it('deve converter probabilidade para odds com exatidão', () => {
      expect(probabilityToOdds(0.5)).toBeCloseTo(1.0, 5);
      expect(probabilityToOdds(0.2)).toBeCloseTo(0.25, 5);
      expect(probabilityToOdds(0.8)).toBeCloseTo(4.0, 5);
      expect(probabilityToOdds(0.0)).toBe(0);
      expect(probabilityToOdds(1.0)).toBe(Infinity);
    });

    it('deve converter odds para probabilidade com exatidão', () => {
      expect(oddsToProbability(1.0)).toBeCloseTo(0.5, 5);
      expect(oddsToProbability(0.25)).toBeCloseTo(0.2, 5);
      expect(oddsToProbability(4.0)).toBeCloseTo(0.8, 5);
      expect(oddsToProbability(0)).toBe(0);
      expect(oddsToProbability(Infinity)).toBe(1.0);
    });

    it('deve rejeitar probabilidades fora da faixa [0, 1]', () => {
      expect(() => probabilityToOdds(-0.1)).toThrow();
      expect(() => probabilityToOdds(1.1)).toThrow();
      expect(() => probabilityToOdds(NaN)).toThrow();
    });

    it('deve rejeitar odds negativos', () => {
      expect(() => oddsToProbability(-1)).toThrow();
      expect(() => oddsToProbability(NaN)).toThrow();
    });
  });

  describe('Cálculo de Probabilidade Pós-Teste (calculatePostTest)', () => {
    it('deve calcular corretamente probabilidade pós-teste com LR+ positivo', () => {
      // Exemplo clínico: Prevalência pré-teste de 10% (P = 0.1, Odds = 0.1111)
      // LR+ de 5.0 -> Odds pós-teste = 0.5555 -> Prob pós-teste = 0.5555 / 1.5555 = 0.3571 (35.7%)
      const result = calculatePostTest(0.1, 5.0);
      expect(result.isValid).toBe(true);
      expect(result.postTestProbability).toBeCloseTo(0.3571, 3);
    });

    it('deve calcular corretamente probabilidade pós-teste com LR- redutor', () => {
      // Prevalência pré-teste de 20% (P = 0.2, Odds = 0.25)
      // LR- de 0.2 -> Odds pós = 0.05 -> Prob pós = 0.05 / 1.05 = 0.0476 (4.76%)
      const result = calculatePostTest(0.2, 0.2);
      expect(result.isValid).toBe(true);
      expect(result.postTestProbability).toBeCloseTo(0.0476, 3);
    });

    it('deve manter probabilidade inalterada quando LR = 1.0 com aviso explícito', () => {
      const result = calculatePostTest(0.25, 1.0);
      expect(result.isValid).toBe(true);
      expect(result.postTestProbability).toBeCloseTo(0.25, 5);
      expect(result.warnings.some((w) => w.includes('RV = 1,0'))).toBe(true);
    });

    it('deve recusar cálculo se a probabilidade pré-teste for 0 ou 1', () => {
      const res0 = calculatePostTest(0, 5.0);
      expect(res0.isValid).toBe(false);
      expect(res0.warnings.length).toBeGreaterThan(0);

      const res1 = calculatePostTest(1, 5.0);
      expect(res1.isValid).toBe(false);
    });
  });

  describe('Valores Preditivos VPP e VPN (calculatePredictiveValues)', () => {
    it('deve calcular VPP e VPN de acordo com a prevalência informada', () => {
      // Teste com Sensibilidade 90%, Especificidade 80%, Prevalência 10%
      // VP = 0.9 * 0.1 = 0.09
      // FP = 0.2 * 0.9 = 0.18
      // VN = 0.8 * 0.9 = 0.72
      // FN = 0.1 * 0.1 = 0.01
      // VPP = 0.09 / (0.09 + 0.18) = 0.09 / 0.27 = 33.3%
      // VPN = 0.72 / (0.72 + 0.01) = 0.72 / 0.73 = 98.63%
      const res = calculatePredictiveValues(0.9, 0.8, 0.1);
      expect(res.isValid).toBe(true);
      expect(res.positivePredictiveValue).toBeCloseTo(0.3333, 3);
      expect(res.negativePredictiveValue).toBeCloseTo(0.9863, 3);
      expect(res.positiveLikelihoodRatio).toBeCloseTo(4.5, 3);
      expect(res.negativeLikelihoodRatio).toBeCloseTo(0.125, 3);
    });

    it('deve rejeitar prevalência ou sensibilidade fora de [0, 1]', () => {
      const res = calculatePredictiveValues(1.5, 0.8, 0.1);
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('Combinação de Razões de Verossimilhança (combineLikelihoodRatios)', () => {
    it('deve aplicar atenuação conservadora quando há múltiplos achados para evitar inflação artificial', () => {
      const lrs = [5.0, 4.0, 3.0];
      const resultConservative = combineLikelihoodRatios(lrs, false);
      const resultNaive = combineLikelihoodRatios(lrs, true);

      // A combinação ingênua daria 5 * 4 * 3 = 60
      expect(resultNaive.combinedLR).toBeCloseTo(60, 1);
      // A combinação conservadora deve amortecer o efeito dependente (menor que 60)
      expect(resultConservative.combinedLR).toBeLessThan(60);
      expect(resultConservative.combinedLR).toBeGreaterThan(5.0);
      expect(resultConservative.cautionNote.toLowerCase()).toContain('atenuação');
    });

    it('retorna LR = 1.0 para lista vazia', () => {
      const res = combineLikelihoodRatios([]);
      expect(res.combinedLR).toBe(1.0);
    });
  });
});
