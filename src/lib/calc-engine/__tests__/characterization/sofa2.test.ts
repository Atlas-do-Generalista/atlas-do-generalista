import { describe, it, expect } from 'vitest';
import { sofa2 } from '../../calculadoras/sofa-2';
import type { ContextoPaciente } from '../../types';

describe('Caracterização: SOFA-2 (Consenso Moreno et al. 2025 / Ranzani et al. 2025)', () => {
  it('deve calcular 0 pontos para paciente de UTI estável com PaO2 arterial >300 mmHg', () => {
    const pacienteEstavel: ContextoPaciente = {
      pas: 120,
      pad: 80, // MAP = 93.3 mmHg (>=70) -> 0 pts
      creatinina: 0.8, // <=1.2 -> 0 pts
      bilirrubina: 0.6, // <=1.2 -> 0 pts
      plaquetas: 250, // >150 -> 0 pts
      peso: 70,
      gcs: 15,
      delirium_tratamento: false, // cérebro -> 0 pts
      fio2: 0.21,
      pao2: 95, // PaO2/FiO2 = 95 / 0.21 = 452 (>300) -> 0 pts
      suporte_ventilatorio_avancado: false,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
    };

    const resultado = sofa2.calcular(pacienteEstavel);
    expect(resultado.valor).toBe(0);
    expect(resultado.unidade).toBe('pontos');
    expect(resultado.detalhamento).toHaveLength(6);
  });

  it('deve calcular pontuação máxima (24 pontos) em falência grave dos 6 sistemas orgânicos', () => {
    const falenciaMultipla: ContextoPaciente = {
      pas: 60,
      pad: 40,
      peso: 70,
      gcs: 4, // <=5 -> cérebro 4 pts
      delirium_tratamento: false,
      fio2: 1.0,
      pao2: 60, // PaO2/FiO2 = 60 (<=75) com suporte -> respiratório 4 pts
      suporte_ventilatorio_avancado: true,
      ecmo_respiratorio: false,
      vasoativos_em_uso: true,
      vasoativos_continuos_1h: true,
      norepinefrina: 0.5, // >0.4 mcg/kg/min -> cardio 4 pts
      bilirrubina: 15.0, // >12.0 -> fígado 4 pts
      creatinina: 5.0,
      terapia_renal_substitutiva: true, // TRS -> renal 4 pts
      plaquetas: 35, // <=50 -> hemostasia 4 pts
    };

    const resultado = sofa2.calcular(falenciaMultipla);
    expect(resultado.valor).toBe(24);
  });

  it('deve utilizar SpO2/FiO2 quando PaO2 não estiver disponível e SpO2 for 97% (faixa calculável <98%)', () => {
    const pacienteSpo2_97: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.40, // 40%
      spo2: 97, // 97 / 0.40 = 242.5 (<=250 -> 2 pts)
      suporte_ventilatorio_avancado: false,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
    };

    const resultado = sofa2.calcular(pacienteSpo2_97);
    const resp = resultado.detalhamento?.find((d) => d.campo === 'respiratorio');
    expect(resp?.pontos).toBe(2);
    expect(resp?.descricao).toContain('SpO₂/FiO₂ ≤250');
    expect(resultado.valor).toBe(2);
  });

  it('deve sinalizar dados insuficientes sem quebrar (sem throw) quando SpO2 >= 98% sem PaO2', () => {
    const pacientePlatoOxi: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.21,
      spo2: 98, // Faixa de platô: SpO2/FiO2 não é aplicável segundo Moreno et al., 2025
      suporte_ventilatorio_avancado: false,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
    };

    // Não deve lançar erro
    const resultado = sofa2.calcular(pacientePlatoOxi);
    const resp = resultado.detalhamento?.find((d) => d.campo === 'respiratorio');
    expect(resp?.pontos).toBeUndefined();
    expect(resp?.descricao).toContain('SpO₂ em platô (≥98%)');
    expect(resultado.avisos?.some((a) => a.includes('Domínio respiratório incompleto/insuficiente'))).toBe(true);

    // Em obterEntradasFaltantes deve alertar sobre a necessidade de PaO2
    const faltando = sofa2.obterEntradasFaltantes!(pacientePlatoOxi);
    expect(faltando.some((f) => f.includes('pao2 (necessário quando SpO2 ≥ 98%'))).toBe(true);
  });

  it('deve pontuar SpO2 < 90% em suporte avançado com 4 pontos quando SpO2/FiO2 <= 120', () => {
    const hipoxemiaSevera: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.8, // 80%
      spo2: 88, // 88 / 0.8 = 110 (<=120 + suporte avançado -> 4 pts)
      suporte_ventilatorio_avancado: true,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
    };

    const resultado = sofa2.calcular(hipoxemiaSevera);
    const resp = resultado.detalhamento?.find((d) => d.campo === 'respiratorio');
    expect(resp?.pontos).toBe(4);
    expect(resp?.descricao).toContain('SpO₂/FiO₂ ≤120');
  });

  it('deve calcular troca gasosa prioritariamente pela PaO2 mesmo se SpO2 for informada como 99%', () => {
    const comGasometriaESpo2: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.5,
      pao2: 70, // PaO2/FiO2 = 70 / 0.5 = 140 (<=150 com suporte -> 3 pts)
      spo2: 99, // Presente, mas PaO2 tem precedência absoluta
      suporte_ventilatorio_avancado: true,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
    };

    const resultado = sofa2.calcular(comGasometriaESpo2);
    const resp = resultado.detalhamento?.find((d) => d.campo === 'respiratorio');
    expect(resp?.pontos).toBe(3);
    expect(resp?.descricao).toContain('PaO₂/FiO₂ ≤150');
  });

  it('deve exigir FiO2 explicitamente em obterEntradasFaltantes quando paciente estiver em oxigenoterapia', () => {
    const pacienteEmO2SemFio2: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      o2_suplementar: true,
      fio2: undefined, // Ausente
      spo2: 95,
      vasoativos_em_uso: false,
    };

    const faltando = sofa2.obterEntradasFaltantes!(pacienteEmO2SemFio2);
    expect(faltando).toContain('fio2');
  });

  it('deve pontuar vasopressina em U/min como outro vasoativo no domínio cardiovascular', () => {
    const pacienteComVaso: ContextoPaciente = {
      pas: 80,
      pad: 50, // MAP = 60 mmHg
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.21,
      pao2: 95,
      suporte_ventilatorio_avancado: false,
      ecmo_respiratorio: false,
      vasoativos_em_uso: true,
      vasoativos_continuos_1h: true,
      norepinefrina: 0,
      vasopressina: 0.03, // 0,03 U/min -> outro vasoativo sem noradrenalina -> 2 pts
    };

    const resultado = sofa2.calcular(pacienteComVaso);
    const cardio = resultado.detalhamento?.find((d) => d.campo === 'cardiovascular');
    expect(cardio?.pontos).toBe(2);
    expect(cardio?.descricao).toContain('Outro vasopressor/inotrópico (ex.: vasopressina U/min)');
  });

  it('deve atribuir 4 pontos no domínio respiratório para ECMO independente de PaO2 ou SpO2', () => {
    const comEcmo: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.8,
      bilirrubina: 0.6,
      plaquetas: 250,
      peso: 70,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.4,
      ecmo_respiratorio: true,
      suporte_ventilatorio_avancado: true,
      vasoativos_em_uso: false,
    };

    const resultado = sofa2.calcular(comEcmo);
    const resp = resultado.detalhamento?.find((d) => d.campo === 'respiratorio');
    expect(resp?.pontos).toBe(4);
  });

  it('deve pontuar o domínio renal pelo pior entre creatinina sérica e débito urinário', () => {
    const oliguriaIsolada: ContextoPaciente = {
      pas: 120,
      pad: 80,
      creatinina: 0.9,
      diurese_ml: 100,
      diurese_horas: 12,
      peso: 70,
      bilirrubina: 0.6,
      plaquetas: 250,
      gcs: 15,
      delirium_tratamento: false,
      fio2: 0.21,
      pao2: 95,
      suporte_ventilatorio_avancado: false,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
    };

    const resultado = sofa2.calcular(oliguriaIsolada);
    const rim = resultado.detalhamento?.find((d) => d.campo === 'renal');
    expect(rim?.pontos).toBe(2);
  });
});
