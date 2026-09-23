import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const sodioCorrigidoGlicemia: Calculadora = {
  id: 'sodio-corrigido-glicemia',
  nome: 'Sódio corrigido pela glicemia',
  categoria: 'laboratorio metabolico',
  entradas: ['sodio', 'glicemia'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const glicemia = dados.glicemia as number;
    const valor = glicemia > 100
      ? na + 2.4 * ((glicemia - 100) / 100)
      : na;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mEq/L',
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio medido' },
        { campo: 'glicemia', valor: glicemia, descricao: 'Glicemia' },
        { campo: 'fator', valor: 2.4, descricao: 'Fator de Hillier (mEq/L por 100 mg/dL acima de 100)' },
      ],
      avisos: [
        'A implementação utiliza o fator de Hillier (2,4 mEq/L para cada 100 mg/dL de glicose acima de 100 mg/dL). Outras fórmulas utilizam 1,6; identifique a convenção usada antes de comparar resultados.',
        'A fórmula foi desenhada para hiperglicemia; quando glicemia ≤100 mg/dL, o valor informado de sódio é mantido.',
      ],
    };
  },
  interpretar: (resultado) => `Sódio corrigido pela glicemia: ${resultado.valor} mEq/L.`,
  populacaoAlvo: 'Adultos com hiperglicemia e hiponatremia/necessidade de estimar o sódio após correção pela glicose.',
  limitacoes: [
    'Fatores de correção variam entre fontes; o resultado não deve ser comparado com fórmulas de fator diferente sem identificar o método.',
  ],
  referencias: [
    {
      titulo: 'Hillier TA, Abbott RD, Barrett EJ. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10225241/',
    },
  ],
  versao: 'Hillier 2,4',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.sodio as number) <= 0) erros.push('Sódio deve ser maior que zero.');
    if ((dados.glicemia as number) < 0) erros.push('Glicemia não pode ser negativa.');
    return erros;
  },
};
