import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const pam: Calculadora = {
  id: 'pam',
  nome: 'Pressão arterial média (PAM)',
  categoria: 'hemodinamica',
  entradas: ['pas', 'pad'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const pas = dados.pas as number;
    const pad = dados.pad as number;
    const valor = (pas + 2 * pad) / 3;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mmHg',
      detalhamento: [
        { campo: 'pas', valor: pas, descricao: 'Pressão arterial sistólica' },
        { campo: 'pad', valor: pad, descricao: 'Pressão arterial diastólica' },
      ],
    };
  },
  interpretar: (resultado) => `PAM calculada: ${resultado.valor} mmHg. A interpretação depende do contexto clínico e da situação hemodinâmica.`,
  populacaoAlvo: 'Adultos nos quais se dispõe de pressão arterial sistólica e diastólica.',
  limitacoes: [
    'A aproximação pela fórmula (PAS + 2×PAD)/3 é adequada para uma estimativa convencional; a relação pode variar em frequências cardíacas extremas e outras condições.',
  ],
  referencias: [
    {
      titulo: 'Fórmula convencional de pressão arterial média',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK538226/',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-09-19',
  validar: (dados) => {
    if ((dados.pas as number) <= 0 || (dados.pad as number) <= 0) {
      return ['PAS e PAD devem ser maiores que zero.'];
    }
    return [];
  },
};
