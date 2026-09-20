import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

export const meld3: Calculadora = {
  id: 'meld-3',
  nome: 'MELD 3.0',
  categoria: 'funcao hepatica',
  entradas: ['idade', 'sexo', 'bilirrubina', 'inr', 'creatinina', 'sodio', 'albumina', 'meld_dialise_semana'],
  calcular: (d): ResultadoCalculadora => {
    const bili = Math.max(1, d.bilirrubina as number);
    const inr = Math.max(1, d.inr as number);
    const crBase = d.meld_dialise_semana ? 3 : Math.min(3, Math.max(1, d.creatinina as number));
    const na = Math.min(137, Math.max(125, d.sodio as number));
    const alb = Math.min(3.5, Math.max(1.5, d.albumina as number));
    const female = d.sexo === 'feminino' ? 1.33 : 0;
    const dNa = 137 - na;
    const lnB = Math.log(bili);
    const lnCr = Math.log(crBase);
    const lnInr = Math.log(inr);
    const raw = female + 4.56 * lnB + 0.82 * dNa - 0.24 * dNa * lnB + 9.09 * lnInr + 11.14 * lnCr + 1.85 * (3.5 - alb) - 1.83 * (3.5 - alb) * lnCr + 6;
    const valor = Math.min(40, Math.max(6, Math.round(raw)));
    const detalhes: DetalheCalculo[] = [
      { campo: 'bilirrubina', valor: bili, descricao: 'Bilirrubina usada (mínimo 1,0 mg/dL)' },
      { campo: 'inr', valor: inr, descricao: 'INR usado (mínimo 1,0)' },
      { campo: 'creatinina', valor: crBase, descricao: `Creatinina usada (1,0–3,0 mg/dL${d.meld_dialise_semana ? '; ajustada para 3,0 por diálise/CRRT' : ''})` },
      { campo: 'sodio', valor: na, descricao: 'Sódio usado, limitado a 125–137 mEq/L' },
      { campo: 'albumina', valor: alb, descricao: 'Albumina usada, limitada a 1,5–3,5 g/dL' },
      { campo: 'idade', valor: d.idade, descricao: 'Idade do candidato (MELD 3.0 adulto)' },
      { campo: 'sexo', valor: d.sexo, descricao: 'Sexo utilizado na equação' },
    ];
    return {
      valor,
      unidade: 'pontos',
      resumo: `MELD 3.0 ${valor}`,
      detalhamento: detalhes,
      avisos: ['O MELD 3.0 é um modelo prognóstico de doença hepática avançada desenvolvido para candidatos adultos à lista de transplante; não deve ser interpretado como escore genérico de lesão hepática aguda.'],
    };
  },
  interpretar: (r) => `MELD 3.0: ${r.valor} pontos. Interprete no contexto de doença hepática avançada e da finalidade para a qual o modelo foi validado.`,
  populacaoAlvo: 'Adultos com doença hepática avançada; população original relacionada à lista de transplante.',
  limitacoes: ['Não usar como substituto de avaliação de insuficiência hepática aguda.', 'Políticas de alocação de órgãos são jurisdicionais e devem ser consultadas separadamente.'],
  referencias: [
    { titulo: 'Kim WR et al. MELD 3.0: The Model for End-Stage Liver Disease Updated for the Modern Era. Gastroenterology. 2021.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8608337/' },
    { titulo: 'OPTN — MELD Calculator', url: 'https://www.hrsa.gov/optn/data-calculators/allocation-calculators/meld-calculator' },
  ],
  versao: '3.0',
  ultimaRevisao: '2026-09-19',
  validar: (d) => {
    const e: string[] = [];
    if (typeof d.idade !== 'number' || d.idade < 18) e.push('O MELD 3.0 adulto deve ser calculado apenas para idade ≥18 anos; para menores, use a via pediátrica apropriada.');
    if (d.sexo !== 'feminino' && d.sexo !== 'masculino') e.push('Selecione sexo masculino ou feminino para o MELD 3.0 adulto.')
    if ((d.bilirrubina as number) <= 0 || (d.inr as number) <= 0 || (d.creatinina as number) <= 0 || (d.sodio as number) <= 0 || (d.albumina as number) <= 0) e.push('Todos os parâmetros laboratoriais do MELD 3.0 devem ser positivos.');
    return e;
  },
};
