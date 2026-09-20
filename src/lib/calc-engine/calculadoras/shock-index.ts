import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const shockIndex: Calculadora = {
  id: 'shock-index',
  nome: 'Shock Index',
  categoria: 'hemodinamica',
  entradas: ['fc', 'pas'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const fc = dados.fc as number;
    const pas = dados.pas as number;
    const valor = fc / pas;

    return {
      valor: Number(valor.toFixed(2)),
      unidade: 'FC/PAS',
      detalhamento: [
        { campo: 'fc', valor: fc, descricao: 'Frequência cardíaca' },
        { campo: 'pas', valor: pas, descricao: 'Pressão arterial sistólica' },
      ],
    };
  },
  interpretar: (resultado) => `Shock Index: ${resultado.valor}. Use o valor em conjunto com o contexto clínico, etiologia presumida e tendência temporal.`,
  populacaoAlvo: 'Adultos com frequência cardíaca e pressão arterial sistólica disponíveis.',
  limitacoes: [
    'O valor isolado não estabelece diagnóstico de choque e não deve ser usado como único critério de decisão.',
  ],
  referencias: [
    {
      titulo: 'Shock Index — conceito original',
      url: 'https://pubmed.ncbi.nlm.nih.gov/960055/',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-09-19',
  validar: (dados) => {
    if ((dados.pas as number) <= 0) return ['PAS deve ser maior que zero.'];
    if ((dados.fc as number) < 0) return ['FC não pode ser negativa.'];
    return [];
  },
};
