import { describe, expect, it } from 'vitest';
import { composeClinicalSummary } from '../composer';
import { pam } from '../../calc-engine/calculadoras/pam';
import { news2 } from '../../calc-engine/calculadoras/news2';
import { shockIndex } from '../../calc-engine/calculadoras/shock-index';

describe('Clinical Summary Composer', () => {
  it('compõe resumo clínico estruturado para paciente de emergência', () => {
    const dados = {
      idade: 72,
      sexo: 'masculino' as const,
      peso: 80,
      altura: 175,
      pas: 85,
      pad: 50,
      fc: 120,
      fr: 28,
      spo2: 89,
      o2_suplementar: false,
      temperatura: 38.2,
      gcs: 13,
      consciencia: 'confusao' as const,
    };

    const resPam = pam.calcular(dados);
    const resNews = news2.calcular(dados);
    const resSi = shockIndex.calcular(dados);

    const output = composeClinicalSummary(dados, [
      { calc: pam, resultado: resPam },
      { calc: news2, resultado: resNews },
      { calc: shockIndex, resultado: resSi },
    ]);

    expect(output.linhaResumoScores).toContain('NEWS2');
    expect(output.linhaResumoScores).toContain('PAM');
    expect(output.paragrafos.length).toBeGreaterThanOrEqual(3);

    const ssvv = output.paragrafos.find((p) => p.categoria === 'ssvv');
    expect(ssvv?.conteudo).toContain('85x50 mmHg');
    expect(ssvv?.conteudo).toContain('PAM 62 mmHg');
    expect(ssvv?.conteudo).toContain('120 bpm');

    expect(output.textoEvolucaoCorrida).toContain('[SINAIS VITAIS E HEMODINÂMICA]');
  });
});
