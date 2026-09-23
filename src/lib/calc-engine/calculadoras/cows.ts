import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

const itens = [
  ['cows_pulso', 'Pulso em repouso', 4],
  ['cows_sudorese', 'Sudorese', 4],
  ['cows_inquietacao', 'Inquietação', 5],
  ['cows_pupilas', 'Tamanho das pupilas', 5],
  ['cows_mialgia', 'Dor óssea/articular', 4],
  ['cows_rinorreia', 'Coriza/lacrimejamento', 4],
  ['cows_gastro', 'Desconforto gastrointestinal', 5],
  ['cows_tremor', 'Tremor', 4],
  ['cows_yawning', 'Bocejos', 4],
  ['cows_ansiedade', 'Ansiedade/irritabilidade', 4],
  ['cows_piloerecao', 'Piloereção', 5],
] as const;

export const cows: Calculadora = {
  id: 'cows',
  nome: 'COWS',
  categoria: 'avaliacoes neurologicas e especificas',
  entradas: itens.map(([campo]) => campo),
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const detalhes = itens.map(([campo, descricao]) => ({
      campo,
      valor: dados[campo],
      pontos: dados[campo] as number,
      descricao,
    }));
    const valor = detalhes.reduce((total, item) => total + (item.pontos ?? 0), 0);
    let gravidade = 'ausente/mínima';
    if (valor >= 37) gravidade = 'grave';
    else if (valor >= 25) gravidade = 'moderadamente grave';
    else if (valor >= 13) gravidade = 'moderada';
    else if (valor >= 5) gravidade = 'leve';

    return {
      valor,
      unidade: 'pontos',
      resumo: `COWS ${valor} — abstinência ${gravidade}`,
      detalhamento: detalhes,
      avisos: [
        'COWS é uma escala clínica para quantificação de sinais e sintomas de abstinência de opioides.',
        'A escala deve ser interpretada no contexto do quadro clínico e não substitui avaliação diagnóstica da síndrome de abstinência.',
      ],
    };
  },
  interpretar: (resultado) => resultado.resumo ?? `COWS: ${resultado.valor} pontos.`,
  populacaoAlvo: 'Adultos com suspeita ou monitorização de abstinência de opioides.',
  limitacoes: [
    'Os itens possuem componentes objetivos e subjetivos; alterações por outras doenças podem influenciar a pontuação.',
  ],
  referencias: [
    {
      titulo: 'Wesson DR, Ling W. The Clinical Opiate Withdrawal Scale (COWS). J Psychoactive Drugs. 2003.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12924748/',
    },
    {
      titulo: 'NIDA — Clinical Opiate Withdrawal Scale',
      url: 'https://nida.nih.gov/sites/default/files/ClinicalOpiateWithdrawalScale.pdf',
    },
  ],
  versao: 'COWS 2003',
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
