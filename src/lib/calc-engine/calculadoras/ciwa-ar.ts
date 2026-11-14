import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

const itens = [
  ['ciwa_nausea', 'Náuseas/vômitos', 7],
  ['ciwa_tremor', 'Tremor', 7],
  ['ciwa_sudorese', 'Sudorese paroxística', 7],
  ['ciwa_ansiedade', 'Ansiedade', 7],
  ['ciwa_agitacao', 'Agitação', 7],
  ['ciwa_tatil', 'Alterações táteis', 7],
  ['ciwa_auditiva', 'Alterações auditivas', 7],
  ['ciwa_visual', 'Alterações visuais', 7],
  ['ciwa_cefaleia', 'Cefaleia/sensação de pressão na cabeça', 7],
  ['ciwa_orientacao', 'Orientação/obnubilação do sensório', 4],
] as const;

export const ciwaAr: Calculadora = {
  id: 'ciwa-ar',
  nome: 'CIWA-Ar',
  categoria: 'avaliacoes neurologicas e especificas',
  tipoMetrica: 'escore',
  dominioClinico: 'especificas',
  entradas: itens.map(([campo]) => campo),
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const detalhes = itens.map(([campo, descricao]) => ({
      campo,
      valor: dados[campo],
      pontos: dados[campo] as number,
      descricao,
    }));
    const valor = detalhes.reduce((total, item) => total + (item.pontos ?? 0), 0);
    let gravidade = 'muito leve';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';

    if (valor >= 21) {
      gravidade = 'grave';
      nivelGravidade = 'critico';
    } else if (valor >= 16) {
      gravidade = 'moderada';
      nivelGravidade = 'alerta';
    } else if (valor >= 10) {
      gravidade = 'leve';
      nivelGravidade = 'atencao';
    }

    return {
      valor,
      unidade: 'pontos',
      resumo: `CIWA-Ar ${valor} — abstinência ${gravidade}`,
      nivelGravidade,
      detalhamento: detalhes,
      avisos: [
        'CIWA-Ar é uma escala de monitorização da síndrome de abstinência alcoólica e deve ser interpretada junto do exame clínico.',
        'Delirium, dificuldade de comunicação, sedação, trauma, infecção e outras causas de alteração do estado mental podem limitar a confiabilidade do escore.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v >= 21) {
      return `CIWA-Ar: ${v} pontos (Abstinência alcoólica grave — alto risco de complicações graves [delirium tremens e convulsões]; indicado tratamento farmacológico intensivo com benzodiazepínicos e vigilância contínua).`;
    }
    if (v >= 16) {
      return `CIWA-Ar: ${v} pontos (Abstinência alcoólica moderada — indicação clássica de início de terapia farmacológica com benzodiazepínicos guiada por sintomas).`;
    }
    if (v >= 10) {
      return `CIWA-Ar: ${v} pontos (Abstinência alcoólica leve — monitorização frequente dos sinais vitais e sintomas; considerar suporte conforme protocolo local).`;
    }
    return `CIWA-Ar: ${v} pontos (Abstinência alcoólica muito leve / ausente — manter reavaliação periódica).`;
  },
  populacaoAlvo: 'Adultos com suspeita ou monitorização de síndrome de abstinência alcoólica.',
  limitacoes: [
    'A escala não deve ser usada isoladamente para diagnosticar abstinência alcoólica.',
    'Protocolos institucionais podem utilizar diferentes pontos de corte para tratamento.',
  ],
  referencias: [
    {
      titulo: 'Sullivan JT et al. Assessment of alcohol withdrawal: the revised clinical institute withdrawal assessment for alcohol scale (CIWA-Ar). Br J Addict. 1989.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/2597811/',
    },
    {
      titulo: 'CIWA-Ar — National Center for Biotechnology Information',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK64829/table/A46039/',
    },
  ],
  versao: 'CIWA-Ar 1989',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    for (const [campo, , max] of itens) {
      const valor = dados[campo];
      if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0 || valor > max) {
        erros.push(`${campo} deve estar entre 0 e ${max}.`);
      }
    }
    return erros;
  },
};
