import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

export const meld3: Calculadora = {
  id: 'meld-3',
  nome: 'MELD 3.0',
  categoria: 'funcao hepatica',
  tipoMetrica: 'escore',
  dominioClinico: 'hepatica',
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

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    let mortalidadeEstimada = '';

    if (valor >= 30) {
      nivelGravidade = 'critico';
      mortalidadeEstimada = valor >= 40 ? 'Mortalidade em 90 dias >70%' : 'Mortalidade em 90 dias ~50%';
    } else if (valor >= 20) {
      nivelGravidade = 'alerta';
      mortalidadeEstimada = 'Mortalidade em 90 dias ~20%';
    } else if (valor >= 10) {
      nivelGravidade = 'atencao';
      mortalidadeEstimada = 'Mortalidade em 90 dias ~6%';
    } else {
      nivelGravidade = 'normal';
      mortalidadeEstimada = 'Mortalidade em 90 dias ~2%';
    }

    const detalhes: DetalheCalculo[] = [
      { campo: 'bilirrubina', valor: bili, descricao: 'Bilirrubina total (mínimo 1,0 mg/dL)' },
      { campo: 'inr', valor: inr, descricao: 'INR (mínimo 1,0)' },
      { campo: 'creatinina', valor: crBase, descricao: `Creatinina usada (1,0–3,0 mg/dL${d.meld_dialise_semana ? '; fixada em 3,0 por diálise/CRRT recente' : ''})` },
      { campo: 'sodio', valor: na, descricao: 'Sódio sérico (limitado a 125–137 mEq/L)' },
      { campo: 'albumina', valor: alb, descricao: 'Albumina sérica (limitada a 1,5–3,5 g/dL)' },
      { campo: 'idade', valor: d.idade, descricao: 'Idade do candidato (MELD 3.0 adulto)' },
      { campo: 'sexo', valor: d.sexo, descricao: `Sexo biológico (${d.sexo === 'feminino' ? '+1,33 pontos para mitigar viés de gênero' : '0 pontos'})` },
    ];

    return {
      valor,
      unidade: 'pontos',
      resumo: `MELD 3.0 ${valor} (${mortalidadeEstimada})`,
      nivelGravidade,
      detalhamento: detalhes,
      avisos: [
        'O MELD 3.0 é a versão moderna do modelo prognóstico para candidatos adultos à lista de transplante hepático, incorporando albumina sérica e coeficiente para mitigar a disparidade histórica contra mulheres candidatas.',
        'Não deve ser interpretado como escore genérico de lesão hepática aguda nem substitui critérios de King\'s College para insuficiência hepática fulminante.',
      ],
    };
  },
  interpretar: (r) => {
    const v = Number(r.valor);
    if (v >= 40) return `MELD 3.0: ${v} pontos (Risco crítico — mortalidade em lista de espera em 90 dias >70%).`;
    if (v >= 30) return `MELD 3.0: ${v} pontos (Risco grave — mortalidade em lista de espera em 90 dias estimada em ~50%).`;
    if (v >= 20) return `MELD 3.0: ${v} pontos (Risco elevado — mortalidade em lista de espera em 90 dias estimada em ~20%).`;
    if (v >= 10) return `MELD 3.0: ${v} pontos (Risco intermediário — mortalidade em lista de espera em 90 dias estimada em ~6%).`;
    return `MELD 3.0: ${v} pontos (Risco baixo — mortalidade em lista de espera em 90 dias estimada em ~2%).`;
  },
  populacaoAlvo: 'Adultos com cirrose hepática em acompanhamento ou lista de transplante hepático.',
  limitacoes: [
    'Não deve ser utilizado em menores de 18 anos (para pediatria, utiliza-se o escore PELD).',
    'Não é validado para insuficiência hepática aguda sem cirrose preexistente.',
  ],
  referencias: [
    {
      titulo: 'Kim WR et al. MELD 3.0: The Model for End-Stage Liver Disease Updated for the Modern Era. Gastroenterology. 2021;161(6):1887-1895.',
      url: 'https://doi.org/10.1053/j.gastro.2021.08.050',
    },
  ],
  versao: '3.0 (2021)',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const e: string[] = [];
    if (typeof d.idade !== 'number' || d.idade < 18) e.push('O MELD 3.0 adulto deve ser calculado apenas para idade ≥18 anos; para menores, use a via pediátrica apropriada.');
    if (d.sexo !== 'feminino' && d.sexo !== 'masculino') e.push('Selecione sexo masculino ou feminino para o MELD 3.0 adulto.');
    if ((d.bilirrubina as number) <= 0 || (d.inr as number) <= 0 || (d.creatinina as number) <= 0 || (d.sodio as number) <= 0 || (d.albumina as number) <= 0) {
      e.push('Todos os parâmetros laboratoriais do MELD 3.0 devem ser positivos.');
    }
    return e;
  },
};
