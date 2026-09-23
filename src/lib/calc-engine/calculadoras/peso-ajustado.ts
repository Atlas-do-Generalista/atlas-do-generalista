import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const pesoAjustado: Calculadora = {
  id: 'peso-ajustado',
  nome: 'Peso ajustado (fator 0,4)',
  categoria: 'antropometria',
  entradas: ['sexo', 'altura', 'peso'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const altura = dados.altura as number;
    const peso = dados.peso as number;
    const sexo = dados.sexo;
    const polegadas = altura / 2.54;
    const acima60 = polegadas - 60;
    const pesoIdeal = sexo === 'masculino'
      ? 50 + 2.3 * acima60
      : 45.5 + 2.3 * acima60;
    const valor = pesoIdeal + 0.4 * (peso - pesoIdeal);

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'kg',
      detalhamento: [
        { campo: 'peso', valor: peso, descricao: 'Peso corporal atual' },
        { campo: 'peso_ideal', valor: Number(pesoIdeal.toFixed(1)), descricao: 'Peso ideal de Devine' },
        { campo: 'fator', valor: 0.4, descricao: 'Fator de ajuste' },
      ],
      avisos: [
        'O fator de 0,4 é uma convenção clínica comum para peso ajustado; métodos e fatores podem variar conforme indicação, fármaco e protocolo.',
        'Quando o peso atual não excede o peso ideal, avalie se há indicação real para utilizar peso ajustado em vez do peso atual.',
      ],
    };
  },
  interpretar: (resultado) => `Peso ajustado estimado: ${resultado.valor} kg.`,
  populacaoAlvo: 'Adultos, principalmente em situações de excesso de peso nas quais um protocolo específico utilize peso ajustado.',
  limitacoes: [
    'Não existe uma única definição universal de peso ajustado para todas as indicações clínicas.',
  ],
  referencias: [
    {
      titulo: 'Ideal body weight: a commentary — revisão das fórmulas de peso ideal e pesos derivados',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8646317/',
    },
  ],
  versao: 'Devine + fator 0,4',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if (dados.sexo !== 'feminino' && dados.sexo !== 'masculino') erros.push('Selecione feminino ou masculino.');
    if ((dados.altura as number) <= 0) erros.push('Altura deve ser maior que zero.');
    if ((dados.peso as number) <= 0) erros.push('Peso deve ser maior que zero.');
    if (typeof dados.idade === 'number' && dados.idade < 18) erros.push('Esta implementação é destinada a adultos.');
    return erros;
  },
};
