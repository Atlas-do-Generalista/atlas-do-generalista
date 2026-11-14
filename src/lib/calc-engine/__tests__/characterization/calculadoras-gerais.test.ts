import { describe, it, expect } from 'vitest';
import { pam } from '../../calculadoras/pam';
import { shockIndex } from '../../calculadoras/shock-index';
import { imc } from '../../calculadoras/imc';
import { superficieCorporal } from '../../calculadoras/superficie-corporal';
import { pesoIdeal } from '../../calculadoras/peso-ideal';
import { pesoAjustado } from '../../calculadoras/peso-ajustado';
import { cockcroftGault } from '../../calculadoras/cockcroft-gault';
import { fena } from '../../calculadoras/fena';
import { feureia } from '../../calculadoras/feureia';
import { childPugh } from '../../calculadoras/child-pugh';
import { meld3 } from '../../calculadoras/meld-3';
import { albi } from '../../calculadoras/albi';
import { osmolaridadePlasmatica } from '../../calculadoras/osmolaridade-plasmatica';
import { osmolaridadeEfetiva } from '../../calculadoras/osmolaridade-efetiva';
import { anionGap } from '../../calculadoras/anion-gap';
import { anionGapAlbumina } from '../../calculadoras/anion-gap-albumina';
import { deltaGap } from '../../calculadoras/delta-gap';
import { sodioCorrigidoGlicemia } from '../../calculadoras/sodio-corrigido-glicemia';
import { rcri } from '../../calculadoras/rcri';
import { padua } from '../../calculadoras/padua';
import { ciwaAr } from '../../calculadoras/ciwa-ar';
import { cows } from '../../calculadoras/cows';

describe('Caracterização: Antropometria', () => {
  it('IMC: peso 70 kg, altura 175 cm deve resultar em 22.9 kg/m²', () => {
    const res = imc.calcular({ peso: 70, altura: 175 });
    expect(res.valor).toBe(22.9);
  });

  it('Superfície Corporal (Mosteller): 170 cm e 70 kg deve resultar em 1.82 m²', () => {
    const res = superficieCorporal.calcular({ altura: 170, peso: 70 });
    expect(res.valor).toBe(1.82);
  });

  it('Peso Ideal (Devine): homem e mulher de 177.8 cm (70 polegadas)', () => {
    const resHomem = pesoIdeal.calcular({ altura: 177.8, sexo: 'masculino' });
    expect(resHomem.valor).toBe(73.0);

    const resMulher = pesoIdeal.calcular({ altura: 177.8, sexo: 'feminino' });
    expect(resMulher.valor).toBe(68.5);
  });

  describe('Peso Ajustado (Bauer et al. 1983 / Pai & Paloucek 2000)', () => {
    it('deve calcular peso ajustado corretamente em paciente obeso com TBW > IBW', () => {
      // Homem 177.8 cm -> IBW = 50 + 2.3 * 10 = 73.0 kg
      // TBW = 100 kg -> Ajustado = 73.0 + 0.4 * (100 - 73.0) = 83.8 kg
      const res = pesoAjustado.calcular({ peso: 100, altura: 177.8, sexo: 'masculino' });
      expect(res.valor).toBe(83.8);
      expect(res.resumo).toContain('83.8 kg');
    });

    it('não deve aplicar peso ajustado quando peso atual for menor que o peso ideal (prevenindo paradoxo clínico)', () => {
      // Homem 177.8 cm -> IBW = 73.0 kg. Paciente pesa 60 kg (eutrófico/desnutrido).
      // Se aplicasse a fórmula cegamente: 73 + 0.4 * (60 - 73) = 67.8 kg (maior que o peso real!).
      // O motor corrigido deve retornar o peso real (60.0 kg) e alertar não aplicabilidade.
      const res = pesoAjustado.calcular({ peso: 60, altura: 177.8, sexo: 'masculino' });
      expect(res.valor).toBe(60.0);
      expect(res.valor).toBeLessThanOrEqual(60.0);
      expect(res.resumo).toContain('não aplicável');
      expect(res.avisos?.some((a) => a.includes('Não aplicável'))).toBe(true);
    });

    it('não deve aplicar peso ajustado quando peso atual for exatamente igual ao peso ideal', () => {
      // Mulher 165.1 cm (65 polegadas) -> IBW = 45.5 + 2.3 * 5 = 57.0 kg
      const res = pesoAjustado.calcular({ peso: 57.0, altura: 165.1, sexo: 'feminino' });
      expect(res.valor).toBe(57.0);
      expect(res.resumo).toContain('não aplicável');
    });

    it('deve alertar limitação metodológica quando a altura for inferior a 152,4 cm (5 pés)', () => {
      const res = pesoAjustado.calcular({ peso: 70, altura: 148, sexo: 'feminino' });
      expect(res.avisos?.some((a) => a.includes('Altura inferior a 152,4 cm'))).toBe(true);
    });
  });
});

describe('Caracterização: Sinais Vitais e Hemodinâmica', () => {
  it('PAM: PAS 120 e PAD 80 mmHg deve resultar em 93.3 mmHg', () => {
    const res = pam.calcular({ pas: 120, pad: 80 });
    expect(res.valor).toBe(93.3);
  });

  describe('Shock Index (FC / PAS — Allgöwer 1967)', () => {
    it('deve classificar Índice de Choque normal na faixa 0,5 a 0,7 (ex.: 0,60)', () => {
      // FC 72 bpm, PAS 120 mmHg -> 72 / 120 = 0.60
      const res = shockIndex.calcular({ fc: 72, pas: 120 });
      expect(res.valor).toBe(0.60);
      expect(res.valor).toBeGreaterThanOrEqual(0.5);
      expect(res.valor).toBeLessThanOrEqual(0.7);
    });

    it('deve identificar hipoperfusão oculta / choque alterado quando > 0,9 (ex.: 1,00)', () => {
      // FC 100 bpm, PAS 100 mmHg -> 100 / 100 = 1.00
      const res = shockIndex.calcular({ fc: 100, pas: 100 });
      expect(res.valor).toBe(1.00);
      expect(res.valor).toBeGreaterThan(0.9);
    });

    it('deve sinalizar choque grave e alto risco de colapso quando > 1,4 (ex.: 1,50)', () => {
      // FC 120 bpm, PAS 80 mmHg -> 120 / 80 = 1.50
      const res = shockIndex.calcular({ fc: 120, pas: 80 });
      expect(res.valor).toBe(1.50);
      expect(res.valor).toBeGreaterThan(1.4);
    });
  });
});

describe('Caracterização: Função Renal e Urinária', () => {
  it('Cockcroft-Gault: homem 60 anos, 70 kg, creatinina 1.0 mg/dL', () => {
    // ((140 - 60) * 70) / (72 * 1.0) = 77.8 mL/min
    const res = cockcroftGault.calcular({ idade: 60, peso: 70, creatinina: 1.0, sexo: 'masculino' });
    expect(res.valor).toBe(77.8);
  });

  it('Cockcroft-Gault: mulher 60 anos, 70 kg, creatinina 1.0 mg/dL (fator 0.85)', () => {
    // 77.777 * 0.85 = 66.1 mL/min
    const res = cockcroftGault.calcular({ idade: 60, peso: 70, creatinina: 1.0, sexo: 'feminino' });
    expect(res.valor).toBe(66.1);
  });

  it('FeNa: NaUr 20, Cr 2.0, Na 140, CrUr 100 deve indicar 0.29% (<1% padrão pré-renal)', () => {
    const res = fena.calcular({ sodio_urinario: 20, creatinina: 2.0, sodio: 140, creatinina_urinaria: 100 });
    expect(res.valor).toBe(0.29);
  });

  it('FeUreia: UrUr 600, Cr 2.0, Ur 80, CrUr 100 deve indicar 15.0%', () => {
    const res = feureia.calcular({ ureia_urinaria: 600, creatinina: 2.0, ureia: 80, creatinina_urinaria: 100 });
    expect(res.valor).toBe(15.0);
  });
});

describe('Caracterização: Função Hepática', () => {
  it('Child-Pugh: classe A (5 pontos)', () => {
    const res = childPugh.calcular({
      bilirrubina: 1.0,
      albumina: 4.0,
      inr: 1.1,
      ascite: 'nenhuma',
      encefalopatia_hepatica: 'nenhuma',
    });
    expect(res.valor).toBe(5);
    expect(res.resumo).toBe('CTP 5A');
  });

  it('Child-Pugh: classe C (15 pontos)', () => {
    const res = childPugh.calcular({
      bilirrubina: 4.0,
      albumina: 2.0,
      inr: 2.6,
      ascite: 'grave_refrataria',
      encefalopatia_hepatica: 'grau_3_4',
    });
    expect(res.valor).toBe(15);
    expect(res.resumo).toBe('CTP 15C');
  });

  it('MELD 3.0: mulher 55 anos com valores fisiológicos basais', () => {
    const res = meld3.calcular({
      idade: 55,
      sexo: 'feminino',
      bilirrubina: 1.0,
      inr: 1.0,
      creatinina: 1.0,
      sodio: 137,
      albumina: 3.5,
      meld_dialise_semana: false,
    });
    expect(res.valor).toBe(7);
  });

  it('ALBI: bilirrubina 1.0 mg/dL e albumina 4.0 g/dL', () => {
    const res = albi.calcular({ bilirrubina: 1.0, albumina: 4.0 });
    expect(res.valor).toBe(-2.59);
  });
});

describe('Caracterização: Laboratório e Metabólico', () => {
  it('Osmolaridade plasmática: Na 140, Glic 90, Ur 30 mg/dL deve resultar em 290.0 mOsm/kg', () => {
    const res = osmolaridadePlasmatica.calcular({ sodio: 140, glicemia: 90, ureia: 30 });
    expect(res.valor).toBe(290.0);
  });

  it('Osmolaridade efetiva: Na 140, Glic 90 mg/dL deve resultar em 285.0 mOsm/kg', () => {
    const res = osmolaridadeEfetiva.calcular({ sodio: 140, glicemia: 90 });
    expect(res.valor).toBe(285.0);
  });

  it('Ânion Gap: Na 140, Cl 104, HCO3 24 mEq/L deve resultar em 12.0 mEq/L', () => {
    const res = anionGap.calcular({ sodio: 140, cloro: 104, hco3: 24 });
    expect(res.valor).toBe(12.0);
  });

  it('Ânion Gap corrigido por albumina: AG 12 com hipoalbuminemia 2.0 g/dL', () => {
    // 12 + 2.5 * (4 - 2.0) = 17.0 mEq/L
    const res = anionGapAlbumina.calcular({ sodio: 140, cloro: 104, hco3: 24, albumina: 2.0 });
    expect(res.valor).toBe(17.0);
  });

  it('Delta Gap: acidose metabólica com ânion gap elevado', () => {
    // Na 140, Cl 100, HCO3 14, Alb 4.0 -> AGc = 26; delta AG = 26 - 12 = 14; delta HCO3 = 24 - 14 = 10; delta gap = 14 - 10 = +4.0
    const res = deltaGap.calcular({ sodio: 140, cloro: 100, hco3: 14, albumina: 4.0 });
    expect(res.valor).toBe(4.0);
  });

  it('Sódio corrigido pela glicemia (fator Hillier 2.4): Na 130 com glicemia 600 mg/dL', () => {
    // 130 + 2.4 * ((600 - 100) / 100) = 142.0 mEq/L
    const res = sodioCorrigidoGlicemia.calcular({ sodio: 130, glicemia: 600 });
    expect(res.valor).toBe(142.0);
  });
});

describe('Caracterização: Risco e Profilaxia', () => {
  it('RCRI: pontuação 0 para cirurgia sem preditores cardíacos', () => {
    const res = rcri.calcular({
      rcri_cirurgia_alto_risco: false,
      rcri_doenca_isquemica: false,
      rcri_insuficiencia_cardiaca: false,
      rcri_doenca_cerebrovascular: false,
      rcri_diabetes_insulina: false,
      creatinina: 1.0,
    });
    expect(res.valor).toBe(0);
  });

  it('RCRI: pontuação 2 para cirurgia de alto risco e diabetes com insulina', () => {
    const res = rcri.calcular({
      rcri_cirurgia_alto_risco: true,
      rcri_doenca_isquemica: false,
      rcri_insuficiencia_cardiaca: false,
      rcri_doenca_cerebrovascular: false,
      rcri_diabetes_insulina: true,
      creatinina: 1.0,
    });
    expect(res.valor).toBe(2);
  });

  describe('Escore de Pádua (Barbar et al. 2010 — corte clínico 3 vs 4 pontos)', () => {
    it('deve classificar baixo risco de TEV no caso limítrofe de exatamente 3 pontos (<4)', () => {
      // Paciente com apenas câncer ativo (3 pontos), idade 50 anos, IMC normal
      const res = padua.calcular({
        padua_cancer_ativo: true, // 3 pts
        padua_teve_vte: false,
        padua_mobilidade_reduzida: false,
        padua_trombofilia: false,
        padua_trauma_cirurgia: false,
        padua_insuficiencia_cardio_respiratoria: false,
        padua_iam_avc: false,
        padua_infeccao_reumatologica: false,
        padua_terapia_hormonal: false,
        idade: 50, // <70 -> 0 pts
        peso: 70,
        altura: 175, // IMC = 22.86 < 30 -> 0 pts
      });

      expect(res.valor).toBe(3);
      expect(res.resumo).toContain('baixo risco de TEV');
    });

    it('deve classificar alto risco de TEV no limiar exato de 4 pontos (≥4)', () => {
      // Câncer ativo (3 pts) + Idade ≥70 anos (1 pt) = 4 pts
      const res = padua.calcular({
        padua_cancer_ativo: true, // 3 pts
        padua_teve_vte: false,
        padua_mobilidade_reduzida: false,
        padua_trombofilia: false,
        padua_trauma_cirurgia: false,
        padua_insuficiencia_cardio_respiratoria: false,
        padua_iam_avc: false,
        padua_infeccao_reumatologica: false,
        padua_terapia_hormonal: false,
        idade: 72, // >=70 -> 1 pt
        peso: 70,
        altura: 175,
      });

      expect(res.valor).toBe(4);
      expect(res.resumo).toContain('alto risco de TEV');
    });

    it('deve classificar alto risco em paciente com múltiplos fatores (6 pontos)', () => {
      const res = padua.calcular({
        padua_cancer_ativo: true, // 3 pts
        padua_teve_vte: false,
        padua_mobilidade_reduzida: true, // 3 pts
        padua_trombofilia: false,
        padua_trauma_cirurgia: false,
        padua_insuficiencia_cardio_respiratoria: false,
        padua_iam_avc: false,
        padua_infeccao_reumatologica: false,
        padua_terapia_hormonal: false,
        idade: 50,
        peso: 70,
        altura: 175,
      });

      expect(res.valor).toBe(6);
      expect(res.resumo).toContain('alto risco de TEV');
    });
  });
});

describe('Caracterização: Escalas de Abstinência (CIWA-Ar e COWS)', () => {
  describe('CIWA-Ar (Sullivan et al. 1989 — gravidade da abstinência alcoólica)', () => {
    it('deve classificar como abstinência muito leve quando pontuação for 0', () => {
      const res = ciwaAr.calcular({
        ciwa_nausea: 0,
        ciwa_tremor: 0,
        ciwa_sudorese: 0,
        ciwa_ansiedade: 0,
        ciwa_agitacao: 0,
        ciwa_tatil: 0,
        ciwa_auditiva: 0,
        ciwa_visual: 0,
        ciwa_cefaleia: 0,
        ciwa_orientacao: 0,
      });
      expect(res.valor).toBe(0);
      expect(res.resumo).toContain('muito leve');
    });

    it('deve classificar abstinência leve na faixa 10 a 15 pontos (ex.: 12 pontos)', () => {
      // Nausea 2 + tremor 3 + sudorese 2 + ansiedade 3 + cefaleia 2 = 12 pts
      const res = ciwaAr.calcular({
        ciwa_nausea: 2,
        ciwa_tremor: 3,
        ciwa_sudorese: 2,
        ciwa_ansiedade: 3,
        ciwa_agitacao: 0,
        ciwa_tatil: 0,
        ciwa_auditiva: 0,
        ciwa_visual: 0,
        ciwa_cefaleia: 2,
        ciwa_orientacao: 0,
      });
      expect(res.valor).toBe(12);
      expect(res.resumo).toContain('abstinência leve');
    });

    it('deve classificar abstinência moderada na faixa 16 a 20 pontos (ex.: 18 pontos)', () => {
      // Nausea 3 + tremor 4 + sudorese 3 + ansiedade 4 + agitação 2 + cefaleia 2 = 18 pts
      const res = ciwaAr.calcular({
        ciwa_nausea: 3,
        ciwa_tremor: 4,
        ciwa_sudorese: 3,
        ciwa_ansiedade: 4,
        ciwa_agitacao: 2,
        ciwa_tatil: 0,
        ciwa_auditiva: 0,
        ciwa_visual: 0,
        ciwa_cefaleia: 2,
        ciwa_orientacao: 0,
      });
      expect(res.valor).toBe(18);
      expect(res.resumo).toContain('abstinência moderada');
    });

    it('deve classificar abstinência grave quando pontuação for ≥21 pontos (ex.: 28 pontos)', () => {
      // Nausea 4 + tremor 5 + sudorese 5 + ansiedade 5 + agitação 4 + tátil 3 + auditiva 2 = 28 pts
      const res = ciwaAr.calcular({
        ciwa_nausea: 4,
        ciwa_tremor: 5,
        ciwa_sudorese: 5,
        ciwa_ansiedade: 5,
        ciwa_agitacao: 4,
        ciwa_tatil: 3,
        ciwa_auditiva: 2,
        ciwa_visual: 0,
        ciwa_cefaleia: 0,
        ciwa_orientacao: 0,
      });
      expect(res.valor).toBe(28);
      expect(res.resumo).toContain('abstinência grave');
    });
  });

  describe('COWS (Wesson & Ling 2003 — âncoras discretas de abstinência de opioides)', () => {
    it('deve classificar abstinência ausente/mínima quando pontuação for 0 (<5)', () => {
      const res = cows.calcular({
        cows_pulso: 0,
        cows_sudorese: 0,
        cows_inquietacao: 0,
        cows_pupilas: 0,
        cows_mialgia: 0,
        cows_rinorreia: 0,
        cows_gastro: 0,
        cows_tremor: 0,
        cows_yawning: 0,
        cows_ansiedade: 0,
        cows_piloerecao: 0,
      });
      expect(res.valor).toBe(0);
      expect(res.resumo).toContain('abstinência ausente/mínima');
    });

    it('deve classificar abstinência leve na faixa 5 a 12 pontos (ex.: âncoras somando 7 pontos)', () => {
      // Pulso 1 (FC 85), Sudorese 1, Mialgia 1, Rinorreia 1, Ansiedade 2, Bocejos 1 = 7 pts
      const res = cows.calcular({
        cows_pulso: 1,
        cows_sudorese: 1,
        cows_inquietacao: 0,
        cows_pupilas: 0,
        cows_mialgia: 1,
        cows_rinorreia: 1,
        cows_gastro: 0,
        cows_tremor: 0,
        cows_yawning: 1,
        cows_ansiedade: 2,
        cows_piloerecao: 0,
      });
      expect(res.valor).toBe(7);
      expect(res.resumo).toContain('abstinência leve');
    });

    it('deve classificar abstinência moderada na faixa 13 a 24 pontos (ex.: âncoras somando 19 pontos)', () => {
      // Pulso 2, Sudorese 2, Inquietação 3, Pupilas 2, Mialgia 2, Gastro 2, Tremor 2, Bocejos 2, Ansiedade 2 = 19 pts
      const res = cows.calcular({
        cows_pulso: 2,
        cows_sudorese: 2,
        cows_inquietacao: 3,
        cows_pupilas: 2,
        cows_mialgia: 2,
        cows_rinorreia: 0,
        cows_gastro: 2,
        cows_tremor: 2,
        cows_yawning: 2,
        cows_ansiedade: 2,
        cows_piloerecao: 0,
      });
      expect(res.valor).toBe(19);
      expect(res.resumo).toContain('abstinência moderada');
    });

    it('deve classificar abstinência moderadamente grave na faixa 25 a 36 pontos (ex.: âncoras somando 30 pontos)', () => {
      // Pulso 2, Sudorese 3, Inquietação 3, Pupilas 2, Mialgia 4, Rinorreia 2, Gastro 3, Tremor 2, Bocejos 2, Ansiedade 4, Piloereção 3 = 30 pts
      const res = cows.calcular({
        cows_pulso: 2,
        cows_sudorese: 3,
        cows_inquietacao: 3,
        cows_pupilas: 2,
        cows_mialgia: 4,
        cows_rinorreia: 2,
        cows_gastro: 3,
        cows_tremor: 2,
        cows_yawning: 2,
        cows_ansiedade: 4,
        cows_piloerecao: 3,
      });
      expect(res.valor).toBe(30);
      expect(res.resumo).toContain('abstinência moderadamente grave');
    });

    it('deve classificar abstinência grave quando pontuação for ≥37 pontos (ex.: âncoras severas somando 48 pontos)', () => {
      // Pulso 4 (>120 bpm), Sudorese 4, Inquietação 5, Pupilas 5, Mialgia 4, Rinorreia 4, Gastro 5, Tremor 4, Bocejos 4, Ansiedade 4, Piloereção 5 = 48 pts
      const res = cows.calcular({
        cows_pulso: 4,
        cows_sudorese: 4,
        cows_inquietacao: 5,
        cows_pupilas: 5,
        cows_mialgia: 4,
        cows_rinorreia: 4,
        cows_gastro: 5,
        cows_tremor: 4,
        cows_yawning: 4,
        cows_ansiedade: 4,
        cows_piloerecao: 5,
      });
      expect(res.valor).toBe(48);
      expect(res.resumo).toContain('abstinência grave');
    });
  });
});
