import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const cockcroftGault: Calculadora = {
  id: 'cockcroft-gault',
  nome: 'Cockcroft-Gault',
  categoria: 'funcao renal',
  entradas: ['idade', 'peso', 'sexo', 'creatinina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const idade = dados.idade as number;
    const peso = dados.peso as number;
    const creatinina = dados.creatinina as number;
    const fatorSexo = dados.sexo === 'feminino' ? 0.85 : 1;

    const valor = ((140 - idade) * peso) / (72 * creatinina) * fatorSexo;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mL/min',
      detalhamento: [
        { campo: 'idade', valor: idade, descricao: 'Idade' },
        { campo: 'peso', valor: peso, descricao: 'Peso utilizado' },
        { campo: 'sexo', valor: dados.sexo, descricao: 'Sexo utilizado' },
        { campo: 'creatinina', valor: creatinina, descricao: 'Creatinina sérica' },
      ],
      avisos: [
        'Esta é a fórmula clássica com o peso fornecido; a seleção do tipo de peso em obesidade/extremos de composição corporal exige julgamento clínico.',
      ],
    };
  },
  interpretar: (resultado) => `Depuração de creatinina estimada por Cockcroft-Gault: ${resultado.valor} mL/min. Verifique a indicação específica da fórmula antes de utilizá-la para ajuste posológico.`,
  populacaoAlvo: 'Adultos para os quais se dispõe de idade, peso, sexo e creatinina.',
  limitacoes: [
    'A fórmula original usa peso corporal; em obesidade, extremos de massa muscular e outras situações, a escolha do peso pode modificar o resultado.',
    'Não confundir com a TFGe CKD-EPI, que é expressa normalizada para 1,73 m².',
  ],
  referencias: [
    {
      titulo: 'National Kidney Foundation — Cockcroft-Gault Equation',
      url: 'https://www.kidney.org/professionals/kdoqi/cockcroft-gault-equation-estimating-creatinine-clearance',
    },
  ],
  versao: '1976',
  ultimaRevisao: '2026-09-19',
  validar: (dados) => {
    const erros: string[] = [];
    const idade = dados.idade as number;
    const peso = dados.peso as number;
    const creatinina = dados.creatinina as number;

    if (idade <= 0 || idade >= 140) erros.push('Idade fora da faixa aceitável para esta implementação.');
    if (peso <= 0) erros.push('Peso deve ser maior que zero.');
    if (creatinina <= 0) erros.push('Creatinina deve ser maior que zero.');
    if (dados.sexo !== 'feminino' && dados.sexo !== 'masculino') {
      erros.push('Selecione feminino ou masculino para esta fórmula.');
    }

    return erros;
  },
};
