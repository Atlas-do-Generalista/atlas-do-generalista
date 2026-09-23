import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const anionGap: Calculadora = {
  id: 'anion-gap',
  nome: 'Ânion gap',
  categoria: 'laboratorio metabolico',
  entradas: ['sodio', 'cloro', 'hco3'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const cl = dados.cloro as number;
    const hco3 = dados.hco3 as number;
    const valor = na - (cl + hco3);

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mEq/L',
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio' },
        { campo: 'cloro', valor: cl, descricao: 'Cloro' },
        { campo: 'hco3', valor: hco3, descricao: 'HCO₃⁻' },
      ],
      avisos: [
        'Esta implementação utiliza a fórmula sem potássio e compara o resultado com referências que também utilizem a mesma convenção.',
      ],
    };
  },
  interpretar: (resultado) => `Ânion gap: ${resultado.valor} mEq/L. A interpretação depende do método do laboratório e do estado de albumina.`,
  populacaoAlvo: 'Adultos com eletrólitos séricos e bicarbonato disponíveis.',
  limitacoes: [
    'Valores de referência variam conforme método laboratorial e inclusão ou não do potássio.',
  ],
  referencias: [
    {
      titulo: 'Anion Gap and Non-Anion Gap Metabolic Acidosis — StatPearls',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK448090/',
    },
  ],
  versao: 'Na − (Cl + HCO₃)',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.sodio as number) <= 0) erros.push('Sódio deve ser maior que zero.');
    if ((dados.cloro as number) < 0) erros.push('Cloro não pode ser negativo.');
    if ((dados.hco3 as number) < 0) erros.push('HCO₃⁻ não pode ser negativo.');
    return erros;
  },
};
