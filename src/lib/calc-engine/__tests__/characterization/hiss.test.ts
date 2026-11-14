import { describe, it, expect } from 'vitest';
import { hiss } from '../../calculadoras/hiss';
import type { ContextoPaciente } from '../../types';

describe('Caracterização: HISS (Head Injury Severity Scale — Stein & Spettell 1995)', () => {
  it('deve classificar como mínima lesão craniana com GCS 15 sem perda de consciência, amnésia ou déficit', () => {
    const casoMinimo: ContextoPaciente = {
      hiss_gcs_inicial: 15,
      hiss_perda_consciencia_minutos: 0,
      hiss_amnesia: false,
      hiss_reacao_lenta: false,
      hiss_deficit_focal: false,
    };

    const resultado = hiss.calcular(casoMinimo);
    expect(resultado.valor).toBe(15);
    expect(resultado.resumo).toBe('HISS: lesão craniana mínima');
  });

  it('deve classificar como leve lesão craniana com GCS 15 mas com amnésia ou perda de consciência breve', () => {
    const casoLeve: ContextoPaciente = {
      hiss_gcs_inicial: 15,
      hiss_perda_consciencia_minutos: 2, // <5 min
      hiss_amnesia: true,
      hiss_reacao_lenta: false,
      hiss_deficit_focal: false,
    };

    const resultado = hiss.calcular(casoLeve);
    expect(resultado.resumo).toBe('HISS: lesão craniana leve');
  });

  it('deve classificar como moderada quando perda de consciência >= 5 minutos, mesmo com GCS 15', () => {
    const casoModeradoPorLoc: ContextoPaciente = {
      hiss_gcs_inicial: 15,
      hiss_perda_consciencia_minutos: 10, // >= 5 min -> moderada
      hiss_amnesia: true,
      hiss_reacao_lenta: false,
      hiss_deficit_focal: false,
    };

    const resultado = hiss.calcular(casoModeradoPorLoc);
    expect(resultado.resumo).toBe('HISS: lesão craniana moderada');
  });

  it('deve classificar como moderada quando houver déficit neurológico focal, mesmo com GCS alto', () => {
    const casoModeradoFocal: ContextoPaciente = {
      hiss_gcs_inicial: 14,
      hiss_perda_consciencia_minutos: 0,
      hiss_amnesia: false,
      hiss_reacao_lenta: false,
      hiss_deficit_focal: true, // focal -> moderada
    };

    const resultado = hiss.calcular(casoModeradoFocal);
    expect(resultado.resumo).toBe('HISS: lesão craniana moderada');
  });

  it('deve classificar como grave para GCS 5–8', () => {
    const casoGrave: ContextoPaciente = {
      hiss_gcs_inicial: 7,
      hiss_perda_consciencia_minutos: 15,
      hiss_amnesia: true,
      hiss_reacao_lenta: true,
      hiss_deficit_focal: false,
    };

    const resultado = hiss.calcular(casoGrave);
    expect(resultado.resumo).toBe('HISS: lesão craniana grave');
  });

  it('deve classificar como crítica para GCS 3–4', () => {
    const casoCritico: ContextoPaciente = {
      hiss_gcs_inicial: 3,
      hiss_perda_consciencia_minutos: 60,
      hiss_amnesia: true,
      hiss_reacao_lenta: true,
      hiss_deficit_focal: true,
    };

    const resultado = hiss.calcular(casoCritico);
    expect(resultado.resumo).toBe('HISS: lesão craniana crítica');
  });

  it('deve validar limites do GCS (3 a 15)', () => {
    const dadosInvalidos: ContextoPaciente = {
      hiss_gcs_inicial: 2,
      hiss_perda_consciencia_minutos: -5,
    };

    const erros = hiss.validar!(dadosInvalidos);
    expect(erros.length).toBe(2);
    expect(erros.some((e) => e.includes('entre 3 e 15'))).toBe(true);
    expect(erros.some((e) => e.includes('negativa'))).toBe(true);
  });
});
