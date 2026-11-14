import { describe, expect, it } from 'vitest';
import { pressaoPulso } from '../../calculadoras/pressao-pulso';
import { pesoPredito } from '../../calculadoras/peso-predito';
import { qsofa } from '../../calculadoras/qsofa';
import { calcioCorrigido } from '../../calculadoras/calcio-corrigido';
import { deficitAguaLivre } from '../../calculadoras/deficit-agua-livre';

describe('Novas Ferramentas Clínicas do Motor de Decisão', () => {
  describe('Pressão de Pulso (PP)', () => {
    it('calcula pressão de pulso normal', () => {
      const res = pressaoPulso.calcular({ pas: 120, pad: 80 });
      expect(res.valor).toBe(40);
      expect(res.nivelGravidade).toBe('normal');
      expect(res.resumo).toContain('40 mmHg');
    });

    it('identifica pressão de pulso convergente (estreitada)', () => {
      const res = pressaoPulso.calcular({ pas: 90, pad: 72 });
      expect(res.valor).toBe(18);
      expect(res.nivelGravidade).toBe('alerta');
      expect(res.resumo).toContain('Convergente');
    });

    it('identifica pressão de pulso divergente (ampla)', () => {
      const res = pressaoPulso.calcular({ pas: 160, pad: 70 });
      expect(res.valor).toBe(90);
      expect(res.nivelGravidade).toBe('atencao');
      expect(res.resumo).toContain('Divergente');
    });
  });

  describe('Peso Predito e Ventilação Protetora (ARDSNet)', () => {
    it('calcula PBW e volumes correntes para homem de 175 cm', () => {
      // 175 cm -> PBW = 50 + 0.91 * (175 - 152.4) = 50 + 20.566 = 70.566 -> 70.6 kg
      // 6 mL/kg = 70.6 * 6 = 423.6 -> 424 mL
      const res = pesoPredito.calcular({ sexo: 'masculino', altura: 175 });
      expect(res.valor).toBe(70.6);
      const v6 = res.detalhamento?.find((d) => d.campo === 'vt_6');
      expect(v6?.valor).toBe(424);
      expect(res.resumo).toContain('70.6 kg');
    });

    it('calcula PBW e volumes correntes para mulher de 160 cm', () => {
      // 160 cm -> PBW = 45.5 + 0.91 * (160 - 152.4) = 45.5 + 6.916 = 52.416 -> 52.4 kg
      // 6 mL/kg = 52.4 * 6 = 314.4 -> 314 mL
      const res = pesoPredito.calcular({ sexo: 'feminino', altura: 160 });
      expect(res.valor).toBe(52.4);
      const v6 = res.detalhamento?.find((d) => d.campo === 'vt_6');
      expect(v6?.valor).toBe(314);
    });
  });

  describe('qSOFA (Sepsis-3)', () => {
    it('calcula pontuação 0 para paciente estável', () => {
      const res = qsofa.calcular({ fr: 16, pas: 120, gcs: 15 });
      expect(res.valor).toBe(0);
      expect(res.nivelGravidade).toBe('normal');
      expect(res.resumo).toContain('Baixo risco');
    });

    it('calcula pontuação positiva (>=2) para paciente com suspeita de deterioração / sepse', () => {
      const res = qsofa.calcular({ fr: 24, pas: 90, gcs: 13 });
      expect(res.valor).toBe(3);
      expect(res.nivelGravidade).toBe('critico');
      expect(res.resumo).toContain('Alto risco');
    });
  });

  describe('Cálcio Corrigido pela Albumina (Payne)', () => {
    it('detecta pseudohipocalcemia em paciente desnutrido/cirrótico', () => {
      // Cálcio total 7.8 mg/dL, Albumina 2.0 g/dL
      // Payne: 7.8 + 0.8 * (4.0 - 2.0) = 7.8 + 1.6 = 9.4 mg/dL
      const res = calcioCorrigido.calcular({ calcio: 7.8, albumina: 2.0 });
      expect(res.valor).toBe(9.4);
      expect(res.nivelGravidade).toBe('normal');
      expect(res.resumo).toContain('9.4 mg/dL');
      expect(res.resumo).toContain('Normal');
      expect(res.avisos?.some((a) => a.includes('falsamente reduzido'))).toBe(true);
    });

    it('detecta hipercalcemia verdadeira desmascarada', () => {
      // Cálcio total 9.8 mg/dL, Albumina 2.5 g/dL
      // Payne: 9.8 + 0.8 * (4.0 - 2.5) = 9.8 + 1.2 = 11.0 mg/dL
      const res = calcioCorrigido.calcular({ calcio: 9.8, albumina: 2.5 });
      expect(res.valor).toBe(11);
      expect(res.nivelGravidade).toBe('alerta');
      expect(res.resumo).toContain('Hipercalcemia');
    });
  });

  describe('Déficit de Água Livre (Adrogué-Madias)', () => {
    it('calcula déficit hídrico para idoso hipernatrêmico', () => {
      // Homem 70 anos (fator 0.5), 70 kg, Na = 160 mEq/L
      // ACT = 70 * 0.5 = 35 L
      // Déficit = 35 * (160 / 140 - 1) = 35 * 0.142857 = 5.0 L
      const res = deficitAguaLivre.calcular({
        sodio: 160,
        peso: 70,
        sexo: 'masculino',
        idade: 70,
      });
      expect(res.valor).toBe(5);
      expect(res.nivelGravidade).toBe('critico');
      expect(res.resumo).toContain('5 L');
      expect(res.avisos?.some((a) => a.includes('8 a 10 mEq/L em 24 horas'))).toBe(true);
    });
  });
});
