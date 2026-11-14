import { describe, it, expect } from 'vitest';
import { news2 } from '../../calculadoras/news2';
import type { ContextoPaciente } from '../../types';

describe('Caracterização: NEWS2 (Royal College of Physicians)', () => {
  it('deve calcular 0 pontos para paciente com parâmetros fisiológicos completamente normais em ar ambiente', () => {
    const pacienteNormal: ContextoPaciente = {
      fr: 16, // 12-20 -> 0
      spo2: 98, // >=96 -> 0
      pas: 120, // 111-219 -> 0
      fc: 72, // 51-90 -> 0
      temperatura: 36.8, // 36.1-38.0 -> 0
      consciencia: 'alerta', // alerta -> 0
      o2_suplementar: false, // ar ambiente -> 0
    };

    const resultado = news2.calcular(pacienteNormal);
    expect(resultado.valor).toBe(0);
    expect(resultado.unidade).toBe('pontos');
    expect(resultado.detalhamento).toHaveLength(7);
  });

  it('deve calcular pontuação máxima possível para cada parâmetro individual (Escala 1)', () => {
    // Casos máximos:
    // FR <= 8 ou >= 25 -> 3 pts
    // SpO2 <= 91 -> 3 pts
    // PAS <= 90 ou >= 220 -> 3 pts
    // FC <= 40 ou >= 131 -> 3 pts
    // Temp <= 35.0 (3 pts) ou >= 39.1 (2 pts)
    // Consciência alterada -> 3 pts
    // O2 suplementar -> 2 pts
    // Total extremo: 3 + 3 + 3 + 3 + 3 + 3 + 2 = 20 pts
    const pacienteExtremo: ContextoPaciente = {
      fr: 30, // >=25 -> 3 pts
      spo2: 88, // <=91 -> 3 pts
      pas: 80, // <=90 -> 3 pts
      fc: 140, // >=131 -> 3 pts
      temperatura: 34.5, // <=35.0 -> 3 pts
      consciencia: 'confusao', // != alerta -> 3 pts
      o2_suplementar: true, // 2 pts
    };

    const resultado = news2.calcular(pacienteExtremo);
    expect(resultado.valor).toBe(20);
  });

  it('deve pontuar 2 pontos de oxigênio suplementar quando o2_suplementar for true', () => {
    const pacienteComO2: ContextoPaciente = {
      fr: 16,
      spo2: 98,
      pas: 120,
      fc: 72,
      temperatura: 36.8,
      consciencia: 'alerta',
      o2_suplementar: true,
    };

    const resultado = news2.calcular(pacienteComO2);
    expect(resultado.valor).toBe(2);
  });

  it('deve pontuar 3 pontos para alteração aguda de consciência (confusão ou rebaixamento)', () => {
    const pacienteConfuso: ContextoPaciente = {
      fr: 16,
      spo2: 98,
      pas: 120,
      fc: 72,
      temperatura: 36.8,
      consciencia: 'rebaixamento',
      o2_suplementar: false,
    };

    const resultado = news2.calcular(pacienteConfuso);
    expect(resultado.valor).toBe(3);
  });
});
