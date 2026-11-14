import { describe, expect, it } from 'vitest';
import { analiseGasometria } from '../../calculadoras/analise-gasometria';

describe('Calculadora de Gasometria e Equilíbrio Ácido-Base (Harrison 21ª Ed.)', () => {
  it('identifica gasometria normal', () => {
    const res = analiseGasometria.calcular({
      ph: 7.40,
      paco2: 40,
      hco3: 24,
      sodio: 140,
      cloro: 104,
    });

    expect(res.valor).toBe(7.4);
    expect(res.nivelGravidade).toBe('normal');
    expect(res.resumo).toContain('Equilíbrio ácido-base normal');
    expect(res.detalhamento?.find((d) => d.campo === 'anion_gap')?.valor).toBe(12);
  });

  it('identifica acidose metabólica com ânion gap elevado e acidose respiratória concomitante (Tabela 58-2)', () => {
    // Exemplo clássico da Tabela 58-2 do Harrison:
    // Paciente com cetoacidose diabética ou sepse e fadiga respiratória
    // pH 7.18, PaCO2 28, HCO3 10, Na 140, Cl 98, Alb 4.0, Lactato 4.5
    // Anion gap = 140 - (98 + 10) = 32 (elevado)
    // Winter: 1.5 * 10 + 8 = 23 (faixa 21 a 25)
    // PaCO2 medido = 28 (> 25): acidose respiratória concomitante
    const res = analiseGasometria.calcular({
      ph: 7.18,
      paco2: 28,
      hco3: 10,
      sodio: 140,
      cloro: 98,
      albumina: 4.0,
      lactato: 4.5,
    });

    expect(res.nivelGravidade).toBe('critico');
    expect(res.resumo).toContain('Acidose metabólica');
    expect(res.resumo).toContain('ânion gap elevado');
    expect(res.resumo).toContain('acidose respiratória');
    expect(res.detalhamento?.find((d) => d.campo === 'anion_gap')?.valor).toBe(32);
    expect(res.detalhamento?.find((d) => d.campo === 'delta_ratio')?.valor).toBeGreaterThan(1);
    expect(res.avisos?.some((a) => a.toLowerCase().includes('hiperlactatemia'))).toBe(true);
  });

  it('identifica acidose metabólica adequadamente compensada (Fórmula de Winter)', () => {
    // HCO3 = 12, PaCO2 = 26.
    // Winter: 1.5 * 12 + 8 = 26 (faixa 24 a 28)
    const res = analiseGasometria.calcular({
      ph: 7.28,
      paco2: 26,
      hco3: 12,
      sodio: 138,
      cloro: 102,
    });

    expect(res.resumo).toContain('Acidose metabólica');
    expect(res.resumo).toContain('compensação respiratória adequada');
    expect(res.detalhamento?.find((d) => d.campo === 'paco2_esperado')?.valor).toBe(26);
  });

  it('identifica alcalose metabólica com compensação respiratória esperada (Tabela 58-1)', () => {
    // pH 7.50, HCO3 = 34, PaCO2 = 47.
    // PaCO2 esperado: 40 + 0.7 * (34 - 24) = 40 + 7 = 47 (faixa 45 a 49)
    const res = analiseGasometria.calcular({
      ph: 7.50,
      paco2: 47,
      hco3: 34,
      sodio: 140,
      cloro: 96,
    });

    expect(res.resumo).toContain('Alcalose metabólica');
    expect(res.resumo).toContain('compensação respiratória adequada');
  });

  it('identifica acidose respiratória aguda', () => {
    // PaCO2 = 60 (variação de 20).
    // Aguda: delta HCO3 esperado = 0.1 * 20 = 2 -> HCO3 esperado = 26.
    const res = analiseGasometria.calcular({
      ph: 7.25,
      paco2: 60,
      hco3: 26,
    });

    expect(res.resumo).toContain('Acidose respiratória');
    expect(res.resumo).toContain('aguda');
  });

  it('identifica acidose respiratória crônica', () => {
    // PaCO2 = 60 (variação de 20).
    // Crônica: delta HCO3 esperado = 0.35 * 20 = 7 -> HCO3 esperado = 31.
    const res = analiseGasometria.calcular({
      ph: 7.33,
      paco2: 60,
      hco3: 31,
    });

    expect(res.resumo).toContain('Acidose respiratória');
    expect(res.resumo).toContain('crônica');
  });

  it('calcula relação PaO2/FiO2 e estratifica oxigenação de Berlim', () => {
    const res = analiseGasometria.calcular({
      ph: 7.35,
      paco2: 40,
      hco3: 22,
      pao2: 70,
      fio2: 0.50,
    });

    const pf = res.detalhamento?.find((d) => d.campo === 'pao2_fio2');
    expect(pf?.valor).toBe(140);
    expect(res.resumo).toContain('PaO₂/FiO₂: 140');
    expect(res.avisos?.some((a) => a.includes('SDRA moderada'))).toBe(true);
  });

  it('aplica correção do ânion gap para hipoalbuminemia', () => {
    // Na 140, Cl 110, HCO3 16 -> AG não corrigido = 140 - 126 = 14
    // Albumina = 2.0 g/dL -> Perda de 2 g/dL * 2.5 = 5 mEq/L
    // AG corrigido = 14 + 2.5 * (4 - 2) = 19
    const res = analiseGasometria.calcular({
      ph: 7.32,
      paco2: 32,
      hco3: 16,
      sodio: 140,
      cloro: 110,
      albumina: 2.0,
    });

    const agCorrigido = res.detalhamento?.find((d) => d.campo === 'anion_gap_albumina');
    expect(agCorrigido?.valor).toBe(19);
  });
});
