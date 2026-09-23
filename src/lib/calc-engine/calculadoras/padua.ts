import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const padua: Calculadora = {
  id: 'padua',
  nome: 'Pádua (risco de TEV em pacientes clínicos internados)',
  categoria: 'risco e profilaxia',
  entradas: [
    'idade',
    'altura',
    'peso',
    'padua_cancer_ativo',
    'padua_teve_vte',
    'padua_mobilidade_reduzida',
    'padua_trombofilia',
    'padua_trauma_cirurgia',
    'padua_insuficiencia_cardio_respiratoria',
    'padua_iam_avc',
    'padua_infeccao_reumatologica',
    'padua_terapia_hormonal',
  ],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const peso = dados.peso as number;
    const alturaM = (dados.altura as number) / 100;
    const imc = peso / (alturaM * alturaM);

    const criterios = [
      ['padua_cancer_ativo', 'Câncer ativo', 3, dados.padua_cancer_ativo === true],
      ['padua_teve_vte', 'TEV prévio (exceto trombose superficial)', 3, dados.padua_teve_vte === true],
      ['padua_mobilidade_reduzida', 'Mobilidade reduzida por ≥3 dias', 3, dados.padua_mobilidade_reduzida === true],
      ['padua_trombofilia', 'Trombofilia conhecida', 3, dados.padua_trombofilia === true],
      ['padua_trauma_cirurgia', 'Trauma/cirurgia recente ≤1 mês', 2, dados.padua_trauma_cirurgia === true],
      ['idade_70', 'Idade ≥70 anos', 1, (dados.idade as number) >= 70],
      ['padua_insuficiencia_cardio_respiratoria', 'Insuficiência cardíaca e/ou respiratória', 1, dados.padua_insuficiencia_cardio_respiratoria === true],
      ['padua_iam_avc', 'IAM agudo ou AVC isquêmico', 1, dados.padua_iam_avc === true],
      ['padua_infeccao_reumatologica', 'Infecção aguda ou doença reumatológica', 1, dados.padua_infeccao_reumatologica === true],
      ['imc_30', 'IMC ≥30 kg/m²', 1, imc >= 30],
      ['padua_terapia_hormonal', 'Terapia hormonal em curso', 1, dados.padua_terapia_hormonal === true],
    ] as const;

    const valor = criterios.reduce((total, [, , pontos, presente]) => total + (presente ? pontos : 0), 0);

    return {
      valor,
      unidade: 'pontos',
      resumo: `Pádua ${valor} pontos — ${valor >= 4 ? 'alto risco de TEV' : 'baixo risco de TEV'}`,
      detalhamento: criterios.map(([campo, descricao, pontos, presente]) => ({
        campo,
        valor: presente,
        pontos: presente ? pontos : 0,
        descricao,
      })),
      avisos: [
        'O escore foi desenvolvido para pacientes clínicos hospitalizados. A decisão de profilaxia deve considerar risco de sangramento, contraindicações e protocolo institucional.',
        'O modelo não deve ser extrapolado automaticamente para todas as populações hospitalizadas, incluindo algumas populações cirúrgicas, gestantes e cenários oncológicos específicos.',
      ],
    };
  },
  interpretar: (resultado) => resultado.resumo ?? `Pádua: ${resultado.valor} pontos.`,
  populacaoAlvo: 'Pacientes adultos clinicamente enfermos e hospitalizados, para avaliação de risco de TEV.',
  limitacoes: [
    'Aplicabilidade depende da população em que o modelo foi estudado e do protocolo de tromboprofilaxia local.',
  ],
  referencias: [
    {
      titulo: 'Barbar S et al. A risk assessment model for the identification of hospitalized medical patients at risk for venous thromboembolism: the Padua Prediction Score. J Thromb Haemost. 2010.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20738765/',
    },
    {
      titulo: 'Queensland Health — Padua Prediction Score',
      url: 'https://www.health.qld.gov.au/__data/assets/pdf_file/0029/1445906/padua-prediction-score-for-risk-vte.pdf',
    },
  ],
  versao: 'Padua 2010',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.idade as number) < 0) erros.push('Idade não pode ser negativa.');
    if ((dados.peso as number) <= 0) erros.push('Peso deve ser maior que zero.');
    if ((dados.altura as number) <= 0) erros.push('Altura deve ser maior que zero.');
    return erros;
  },
};
