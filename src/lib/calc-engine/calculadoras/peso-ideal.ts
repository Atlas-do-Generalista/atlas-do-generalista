import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const pesoIdeal: Calculadora = {
  id: 'peso-ideal',
  nome: 'Peso ideal (Devine)',
  categoria: 'antropometria',
  entradas: ['sexo', 'altura'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const altura = dados.altura as number;
    const sexo = dados.sexo;
    const polegadas = altura / 2.54;
    const acima60 = polegadas - 60;
    const valor = sexo === 'masculino'
      ? 50 + 2.3 * acima60
      : 45.5 + 2.3 * acima60;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'kg',
      detalhamento: [
        { campo: 'sexo', valor: sexo, descricao: 'Sexo utilizado na fórmula' },
        { campo: 'altura', valor: altura, descricao: 'Altura' },
      ],
      avisos: [
        'O peso ideal de Devine é uma estimativa antropométrica histórica; não representa necessariamente um peso-alvo individual.',
      ],
    };
  },
  interpretar: (resultado) => `Peso ideal estimado pela fórmula de Devine: ${resultado.valor} kg.`,
  populacaoAlvo: 'Adultos; fórmula de Devine.',
  limitacoes: [
    'A fórmula depende do sexo binário empregado na equação original.',
    'O conceito de "peso ideal" não corresponde necessariamente ao peso corporal fisiologicamente ideal de um indivíduo.',
  ],
  referencias: [
    {
      titulo: 'Devine BJ. Gentamicin therapy. Drug Intelligence and Clinical Pharmacy. 1974.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/?term=Devine+1974+gentamicin+ideal+body+weight',
    },
    {
      titulo: 'Ideal body weight: a commentary — revisão das fórmulas de peso ideal',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8646317/',
    },
  ],
  versao: 'Devine 1974',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if (dados.sexo !== 'feminino' && dados.sexo !== 'masculino') {
      erros.push('Selecione feminino ou masculino para a fórmula de Devine.');
    }
    if ((dados.altura as number) <= 0) erros.push('Altura deve ser maior que zero.');
    if (typeof dados.idade === 'number' && dados.idade < 18) {
      erros.push('Esta implementação é destinada a adultos.');
    }
    return erros;
  },
};
