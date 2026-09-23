import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const feureia: Calculadora = {
  id: 'fe-ureia',
  nome: 'Fração de excreção de ureia (FeUreia)',
  categoria: 'funcao renal',
  entradas: ['ureia', 'creatinina', 'ureia_urinaria', 'creatinina_urinaria'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const ureia = dados.ureia as number;
    const cr = dados.creatinina as number;
    const uUreia = dados.ureia_urinaria as number;
    const uCr = dados.creatinina_urinaria as number;
    const valor = ((uUreia * cr) / (ureia * uCr)) * 100;

    return {
      valor: Number(valor.toFixed(2)),
      unidade: '%',
      detalhamento: [
        { campo: 'ureia', valor: ureia, descricao: 'Ureia sérica (mg/dL)' },
        { campo: 'creatinina', valor: cr, descricao: 'Creatinina sérica (mg/dL)' },
        { campo: 'ureia_urinaria', valor: uUreia, descricao: 'Ureia urinária (mg/dL)' },
        { campo: 'creatinina_urinaria', valor: uCr, descricao: 'Creatinina urinária (mg/dL)' },
      ],
      avisos: [
        'Use o mesmo analito de ureia nas amostras sérica e urinária. A FeUreia tem utilidade limitada para separar lesão renal pré-renal de intrínseca, inclusive em pacientes em uso de diuréticos.',
      ],
    };
  },
  interpretar: (resultado) => `FeUreia: ${resultado.valor}%. Interprete em conjunto com a história, exame físico, sedimento urinário e demais dados de função renal.`,
  populacaoAlvo: 'Adultos com dados séricos e urinários pareados para avaliação de lesão renal.',
  limitacoes: [
    'A FeUreia não substitui a avaliação clínica e não tem desempenho perfeito para diferenciar etiologias de lesão renal aguda.',
    'Resultados dependem do momento da coleta e das condições clínicas concomitantes.',
  ],
  referencias: [
    {
      titulo: 'Utility of fractional excretion of urea in acute kidney injury with comparison to fractional excretion of sodium: systematic review and meta-analysis. Am J Med Sci. 2024.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/38768779/',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.ureia as number) <= 0) erros.push('Ureia sérica deve ser maior que zero.');
    if ((dados.creatinina as number) <= 0) erros.push('Creatinina sérica deve ser maior que zero.');
    if ((dados.ureia_urinaria as number) < 0) erros.push('Ureia urinária não pode ser negativa.');
    if ((dados.creatinina_urinaria as number) <= 0) erros.push('Creatinina urinária deve ser maior que zero.');
    return erros;
  },
};
