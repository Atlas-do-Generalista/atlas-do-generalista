import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const anionGap: Calculadora = {
  id: 'anion-gap',
  nome: 'Ânion gap',
  categoria: 'laboratorio metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'gasometria',
  entradas: ['sodio', 'cloro', 'hco3'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const cl = dados.cloro as number;
    const hco3 = dados.hco3 as number;
    const valor = Number((na - (cl + hco3)).toFixed(1));

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' = 'normal';
    let status = 'Normal (8 a 12 mEq/L)';
    if (valor > 12) {
      status = 'Elevado (>12 mEq/L)';
      nivelGravidade = valor > 20 ? 'alerta' : 'atencao';
    } else if (valor < 8) {
      status = 'Reduzido (<8 mEq/L)';
      nivelGravidade = 'atencao';
    }

    return {
      valor,
      unidade: 'mEq/L',
      resumo: `Ânion gap ${valor} mEq/L (${status})`,
      nivelGravidade,
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
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v > 12) {
      return `Ânion gap: ${v} mEq/L (Elevado [referência: 8 a 12 mEq/L] — indicativo de acidose metabólica com ânion gap aumentado; investigar cetoacidose, acidose lática, uremia e intoxicações exógenas).`;
    }
    if (v < 8) {
      return `Ânion gap: ${v} mEq/L (Reduzido [<8 mEq/L] — frequentemente secundário a hipoalbuminemia importante, mieloma múltiplo ou hipercalcemia/hipermagnesemia).`;
    }
    return `Ânion gap: ${v} mEq/L (Normal [8 a 12 mEq/L]).`;
  },
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
