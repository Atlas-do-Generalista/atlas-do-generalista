import { describe, it, expect } from 'vitest';
import { apache2 } from '../../calculadoras/apache2';
import type { ContextoPaciente } from '../../types';

describe('Caracterização: APACHE II (Knaus et al., 1985 canônico)', () => {
  it('deve pontuar 0 em paciente hígido com todos os parâmetros fisiológicos ideais', () => {
    const pacienteNormal: ContextoPaciente = {
      idade: 30, // <44 -> 0 pts
      pas: 120,
      pad: 75, // MAP = (120 + 150)/3 = 90 (0 pts)
      temperatura: 37.0, // 36-38.4 -> 0 pts
      fc: 80, // 70-109 -> 0 pts
      fr: 16, // 12-24 -> 0 pts
      fio2: 0.21,
      pao2: 95, // >70 -> 0 pts
      ph: 7.40, // 7.33-7.49 -> 0 pts
      sodio: 140, // 130-149 -> 0 pts
      potassio: 4.0, // 3.5-5.4 -> 0 pts
      creatinina: 0.9, // 0.6-1.4 -> 0 pts
      glicemia: 100, // Deve ser ignorada pelo escore canônico
      hematocrito: 40, // 30-45.9 -> 0 pts
      leucocitos: 8, // 3-14.9 -> 0 pts
      gcs: 15, // 15 - 15 = 0 pts
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false, // 0 pts
    };

    const resultado = apache2.calcular(pacienteNormal);
    expect(resultado.valor).toBe(0);
    expect(resultado.unidade).toBe('pontos');
    // Deve conter exatamente as 12 variáveis fisiológicas + idade + saúde crônica = 14 itens (sem glicemia)
    expect(resultado.detalhamento).toHaveLength(14);
    expect(resultado.detalhamento?.some((d) => d.campo === 'glicemia')).toBe(false);
  });

  it('deve calcular corretamente caso crítico com extrema alteração em todos os domínios (Knaus 1985)', () => {
    const pacienteCritico: ContextoPaciente = {
      idade: 78, // >=75 -> 6 pts
      pas: 190,
      pad: 150, // MAP = (190 + 300)/3 = 163.3 -> >=160 -> 4 pts
      temperatura: 41.5, // >=41 -> 4 pts
      fc: 185, // >=180 -> 4 pts
      fr: 52, // >=50 -> 4 pts
      fio2: 0.60, // >=0.5 -> usa aado2
      aado2: 550, // >=500 mmHg na Tabela 1 de Knaus 1985 -> 4 pts
      ph: 7.10, // <7.15 -> 4 pts
      sodio: 185, // >=180 -> 4 pts
      potassio: 7.2, // >=7.0 -> 4 pts
      creatinina: 4.0, // >=3.5 -> 4 pts; com IRA -> dobro (8 pts)
      ira_atual: true,
      glicemia: 480, // NÃO faz parte do escore (Knaus 1985)
      hematocrito: 62, // >=60 -> 4 pts
      leucocitos: 45, // >=40 -> 4 pts
      gcs: 3, // 15 - 3 = 12 pts
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: true, // clínica/urgência -> 5 pts
    };

    // Componentes fisiológicos (12 variáveis):
    // Temp (4) + MAP (4) + FC (4) + FR (4) + A-aDO2 (4) + pH (4) + Na (4) + K (4) + Cr (8) + Hct (4) + Leuc (4) + GCS (12) = 60 pts
    // Idade: 6 pts
    // Doença crônica: 5 pts
    // Total Knaus 1985 canônico = 60 + 6 + 5 = 71 pts
    const resultado = apache2.calcular(pacienteCritico);
    expect(resultado.valor).toBe(71);
  });

  it('deve demonstrar independência rigorosa da glicemia (teste clínico obrigatório)', () => {
    const pacienteBase: ContextoPaciente = {
      idade: 55, // 55-64 -> 2 pts
      pas: 130,
      pad: 80, // MAP = (130 + 160)/3 = 96.7 -> 0 pts
      temperatura: 38.0, // 0 pts
      fc: 95, // 0 pts
      fr: 18, // 0 pts
      fio2: 0.21,
      pao2: 85, // 0 pts
      ph: 7.38, // 0 pts
      sodio: 138, // 0 pts
      potassio: 4.2, // 0 pts
      creatinina: 1.1, // 0 pts
      hematocrito: 38, // 0 pts
      leucocitos: 9, // 0 pts
      gcs: 14, // 15 - 14 = 1 pt
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false, // 0 pts
      glicemia: 95, // glicemia normal
    };

    const resGlicemiaNormal = apache2.calcular(pacienteBase);
    const resGlicemiaSevera = apache2.calcular({
      ...pacienteBase,
      glicemia: 650, // hiperglicemia extrema
    });
    const resSemGlicemia = apache2.calcular({
      ...pacienteBase,
      glicemia: undefined,
    });

    // Idade 55-64 = 3 pts (Knaus 1985 Table 1) + GCS 14 = 1 pt. Total = 4 pts
    expect(resGlicemiaNormal.valor).toBe(4);
    expect(resGlicemiaSevera.valor).toBe(4);
    expect(resSemGlicemia.valor).toBe(4);
    expect(resGlicemiaSevera.valor).toBe(resGlicemiaNormal.valor);

    // Certifica que nenhum campo de glicemia está presente no detalhamento
    expect(resGlicemiaSevera.detalhamento?.some((d) => d.campo === 'glicemia')).toBe(false);
  });

  it('deve dobrar a pontuação de creatinina quando insuficiência renal aguda estiver presente', () => {
    const pacienteComCrElevada: ContextoPaciente = {
      idade: 40,
      pas: 120,
      pad: 80,
      temperatura: 37.0,
      fc: 80,
      fr: 16,
      fio2: 0.21,
      pao2: 95,
      ph: 7.40,
      sodio: 140,
      potassio: 4.0,
      creatinina: 2.5, // Faixa 2.0–3.4 mg/dL -> 3 pontos em Knaus 1985
      hematocrito: 40,
      leucocitos: 8,
      gcs: 15,
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false,
      ira_atual: false,
    };

    const resSemIra = apache2.calcular(pacienteComCrElevada);
    const detalheCrSemIra = resSemIra.detalhamento?.find((d) => d.campo === 'creatinina');
    expect(detalheCrSemIra?.pontos).toBe(3);
    expect(resSemIra.valor).toBe(3);

    const resComIra = apache2.calcular({
      ...pacienteComCrElevada,
      ira_atual: true,
    });
    const detalheCrComIra = resComIra.detalhamento?.find((d) => d.campo === 'creatinina');
    expect(detalheCrComIra?.pontos).toBe(6); // Dobrado: 3 * 2 = 6
    expect(resComIra.valor).toBe(6);
  });

  it('deve utilizar HCO3 venoso sérico conforme Knaus 1985 quando pH arterial estiver ausente', () => {
    const pacienteSemPh: ContextoPaciente = {
      idade: 40,
      pas: 120,
      pad: 80,
      temperatura: 37.0,
      fc: 80,
      fr: 16,
      fio2: 0.21,
      pao2: 95,
      ph: undefined, // Sem gasometria arterial
      hco3: 14, // HCO3 < 15 mEq/L -> 4 pontos conforme Table 1 de Knaus 1985
      sodio: 140,
      potassio: 4.0,
      creatinina: 1.0,
      hematocrito: 40,
      leucocitos: 8,
      gcs: 15,
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false,
    };

    const resultado = apache2.calcular(pacienteSemPh);
    const detalheAcidoBase = resultado.detalhamento?.find((d) => d.campo === 'hco3');
    expect(detalheAcidoBase?.pontos).toBe(4);
    expect(detalheAcidoBase?.descricao).toContain('HCO₃⁻ sérico venoso');
    expect(resultado.valor).toBe(4);
    expect(resultado.avisos?.some((a) => a.includes('HCO₃⁻ sérico venoso em substituição ao pH'))).toBe(true);
  });

  it('deve ponderar adequadamente saúde crônica em pós-operatório eletivo (2 pts)', () => {
    const pacienteEletivo: ContextoPaciente = {
      idade: 30,
      pas: 120,
      pad: 75,
      temperatura: 37.0,
      fc: 80,
      fr: 16,
      fio2: 0.21,
      pao2: 95,
      ph: 7.40,
      sodio: 140,
      potassio: 4.0,
      creatinina: 0.9,
      hematocrito: 40,
      leucocitos: 8,
      gcs: 15,
      tipo_admissao: 'pos_operatorio_eletivo',
      insuficiencia_organica_grave_imunossupressao: true,
    };

    const resultado = apache2.calcular(pacienteEletivo);
    expect(resultado.valor).toBe(2);
  });

  it('deve reportar dependência condicional de oxigenação e equilíbrio ácido-base em obterEntradasFaltantes', () => {
    const dadosSemOxigenio: ContextoPaciente = {
      idade: 40,
      pas: 120,
      pad: 80,
      temperatura: 37,
      fc: 70,
      fr: 14,
      fio2: 0.21,
      ph: 7.4,
      sodio: 140,
      potassio: 4,
      creatinina: 1,
      hematocrito: 40,
      leucocitos: 7,
      gcs: 15,
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false,
    };

    const faltandoBaixoO2 = apache2.obterEntradasFaltantes!(dadosSemOxigenio);
    expect(faltandoBaixoO2).toContain('pao2');

    const faltandoAltoO2 = apache2.obterEntradasFaltantes!({
      ...dadosSemOxigenio,
      fio2: 0.6,
    });
    expect(faltandoAltoO2).toContain('aado2');

    const faltandoAcidoBase = apache2.obterEntradasFaltantes!({
      ...dadosSemOxigenio,
      ph: undefined,
      hco3: undefined,
    });
    expect(faltandoAcidoBase).toContain('ph ou hco3');
  });

  it('deve invalidar entradas com valores clinicamente implausíveis', () => {
    const dadosInvalidos: ContextoPaciente = {
      idade: 40,
      pas: 120,
      pad: 80,
      temperatura: 55, // Implausível (>45)
      fc: 70,
      fr: 14,
      fio2: 1.5, // Implausível (>1.0)
      ph: 5.8, // Implausível (<6.5)
      sodio: -10, // Implausível (<=0)
      potassio: -2, // Implausível (<=0)
      creatinina: -1, // Implausível (<=0)
      hematocrito: 40,
      leucocitos: 8,
      gcs: 18, // Implausível (>15)
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false,
    };

    const erros = apache2.validar!(dadosInvalidos);
    expect(erros.length).toBeGreaterThanOrEqual(6);
  });
});
