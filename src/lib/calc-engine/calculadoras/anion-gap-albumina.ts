import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const anionGapAlbumina: Calculadora = {
  id: 'anion-gap-albumina',
  nome: 'Ânion gap corrigido por albumina',
  categoria: 'laboratorio metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'gasometria',
  entradas: ['sodio', 'cloro', 'hco3', 'albumina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const cl = dados.cloro as number;
    const hco3 = dados.hco3 as number;
    const albumina = dados.albumina as number;
    const ag = na - (cl + hco3);
    const valor = ag + 2.5 * (4 - albumina);
    const valorArredondado = Number(valor.toFixed(1));

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' = 'normal';
    if (valorArredondado > 20) nivelGravidade = 'alerta';
    else if (valorArredondado > 12) nivelGravidade = 'atencao';

    return {
      valor: valorArredondado,
      unidade: 'mEq/L',
      resumo: `AGc ${valorArredondado} mEq/L (${valorArredondado > 12 ? 'Elevado' : 'Normal'})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'anion_gap', valor: Number(ag.toFixed(1)), descricao: 'Ânion gap não corrigido' },
        { campo: 'albumina', valor: albumina, descricao: 'Albumina (g/dL)' },
        { campo: 'valor_referencia_albumina', valor: 4, descricao: 'Albumina de referência (4,0 g/dL)' },
      ],
      avisos: [
        'A correção utiliza +2,5 mEq/L para cada 1 g/dL de albumina abaixo de 4 g/dL.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v > 12) {
      return `Ânion gap corrigido por albumina: ${v} mEq/L (Elevado [referência: 8 a 12 mEq/L] — desmascara acidose metabólica com ânion gap elevado que estaria oculta pela hipoalbuminemia).`;
    }
    return `Ânion gap corrigido por albumina: ${v} mEq/L (Dentro da faixa normal corrigida de 8 a 12 mEq/L).`;
  },
  populacaoAlvo: 'Adultos com eletrólitos, bicarbonato e albumina séricos.',
  limitacoes: [
    'A correção é uma estimativa e depende da convenção utilizada para o valor normal de albumina.',
  ],
  referencias: [
    {
      titulo: 'Anion gap corrected for albumin — revisão fisiológica e fórmula de correção',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/4022011/',
    },
    {
      titulo: 'Anion Gap and Non-Anion Gap Metabolic Acidosis — StatPearls',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK448090/',
    },
  ],
  versao: 'Figge / correção 2,5 × (4 − albumina)',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.sodio as number) <= 0) erros.push('Sódio deve ser maior que zero.');
    if ((dados.cloro as number) < 0) erros.push('Cloro não pode ser negativo.');
    if ((dados.hco3 as number) < 0) erros.push('HCO₃⁻ não pode ser negativo.');
    if ((dados.albumina as number) <= 0) erros.push('Albumina deve ser maior que zero.');
    return erros;
  },
};
