import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const rcri: Calculadora = {
  id: 'rcri',
  nome: 'RCRI (Índice Cardíaco Revisado de Lee)',
  categoria: 'risco e profilaxia',
  entradas: [
    'rcri_cirurgia_alto_risco',
    'rcri_doenca_isquemica',
    'rcri_insuficiencia_cardiaca',
    'rcri_doenca_cerebrovascular',
    'rcri_diabetes_insulina',
    'creatinina',
  ],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const criterios = [
      ['rcri_cirurgia_alto_risco', 'Cirurgia de alto risco', dados.rcri_cirurgia_alto_risco],
      ['rcri_doenca_isquemica', 'Doença cardíaca isquêmica', dados.rcri_doenca_isquemica],
      ['rcri_insuficiencia_cardiaca', 'Insuficiência cardíaca', dados.rcri_insuficiencia_cardiaca],
      ['rcri_doenca_cerebrovascular', 'Doença cerebrovascular (AVC/AIT)', dados.rcri_doenca_cerebrovascular],
      ['rcri_diabetes_insulina', 'Diabetes em uso de insulina', dados.rcri_diabetes_insulina],
      ['creatinina', 'Creatinina ≥2,0 mg/dL', (dados.creatinina as number) >= 2],
    ] as const;

    const valor = criterios.reduce((total, [, , presente]) => total + (presente === true ? 1 : 0), 0);
    const classe = valor === 0 ? 'I' : valor === 1 ? 'II' : valor === 2 ? 'III' : 'IV';

    return {
      valor,
      unidade: 'pontos',
      resumo: `RCRI ${valor} pontos — classe histórica ${classe}`,
      detalhamento: criterios.map(([campo, descricao, presente]) => ({
        campo,
        valor: presente,
        pontos: presente === true ? 1 : 0,
        descricao,
      })),
      avisos: [
        'O RCRI foi derivado para avaliação perioperatória de cirurgia não cardíaca; não é uma ferramenta geral para risco cardiovascular fora desse contexto.',
        'A creatinina foi implementada com ponto de corte contemporâneo ≥2,0 mg/dL; a descrição original é frequentemente reproduzida como >2,0 mg/dL.',
      ],
    };
  },
  interpretar: (resultado) => resultado.resumo ?? `RCRI: ${resultado.valor} pontos.`,
  populacaoAlvo: 'Adultos em avaliação pré-operatória de cirurgia não cardíaca.',
  limitacoes: [
    'As classes históricas I–IV vêm do RCRI original e não representam necessariamente o risco observado em todas as populações contemporâneas.',
    'Não substitui avaliação clínica, tipo/urgência da cirurgia, capacidade funcional ou outros modelos perioperatórios.',
  ],
  referencias: [
    {
      titulo: 'Lee TH et al. Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. Circulation. 1999.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Lee+1999+revised+cardiac+risk+index',
    },
    {
      titulo: '2024 AHA/ACC Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery',
      url: 'https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001285',
    },
  ],
  versao: 'RCRI / Lee',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.creatinina as number) < 0) erros.push('Creatinina não pode ser negativa.');
    return erros;
  },
};
