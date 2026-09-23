import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const superficieCorporal: Calculadora = {
  id: 'superficie-corporal',
  nome: 'Superfície corporal (Mosteller)',
  categoria: 'antropometria',
  entradas: ['peso', 'altura'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const peso = dados.peso as number;
    const altura = dados.altura as number;
    const valor = Math.sqrt((altura * peso) / 3600);

    return {
      valor: Number(valor.toFixed(2)),
      unidade: 'm²',
      detalhamento: [
        { campo: 'peso', valor: peso, descricao: 'Peso' },
        { campo: 'altura', valor: altura, descricao: 'Altura' },
      ],
    };
  },
  interpretar: (resultado) => `Superfície corporal estimada: ${resultado.valor} m² pelo método de Mosteller.`,
  populacaoAlvo: 'Adultos e crianças nos quais se deseja estimar a superfície corporal a partir de peso e altura.',
  limitacoes: [
    'Existem múltiplas equações de superfície corporal; a implementação utiliza Mosteller por sua simplicidade e ampla utilização clínica.',
  ],
  referencias: [
    {
      titulo: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317:1098.',
      url: 'https://doi.org/10.1056/NEJM198710223171717',
    },
  ],
  versao: 'Mosteller 1987',
  ultimaRevisao: '2026-09-22',
};
