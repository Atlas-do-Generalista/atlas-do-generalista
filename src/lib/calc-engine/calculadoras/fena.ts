import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const fena: Calculadora = {
  id: 'fena',
  nome: 'Fração de excreção de sódio (FeNa)',
  categoria: 'funcao renal',
  tipoMetrica: 'indice',
  dominioClinico: 'renal',
  entradas: ['sodio', 'creatinina', 'sodio_urinario', 'creatinina_urinaria'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const cr = dados.creatinina as number;
    const una = dados.sodio_urinario as number;
    const ucr = dados.creatinina_urinaria as number;
    const valor = ((una * cr) / (na * ucr)) * 100;

    const nivelGravidade: 'normal' | 'atencao' | 'alerta' = valor > 2.0 ? 'alerta' : valor < 1.0 ? 'atencao' : 'normal';

    return {
      valor: Number(valor.toFixed(2)),
      unidade: '%',
      resumo: `FeNa ${valor.toFixed(2)}% (${valor < 1.0 ? 'Padrão pré-renal' : valor > 2.0 ? 'Padrão NTA / intrínseco' : 'Indeterminado'})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico (mEq/L)' },
        { campo: 'creatinina', valor: cr, descricao: 'Creatinina sérica (mg/dL)' },
        { campo: 'sodio_urinario', valor: una, descricao: 'Sódio urinário (mEq/L)' },
        { campo: 'creatinina_urinaria', valor: ucr, descricao: 'Creatinina urinária (mg/dL)' },
      ],
      avisos: [
        'FeNa é um marcador auxiliar e sua interpretação depende do contexto, inclusive uso de diuréticos e causas de lesão renal nas quais a excreção de sódio pode permanecer baixa.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 1.0) {
      return `FeNa: ${v}% (<1,0% — Padrão pré-renal / avidez tubular renal por sódio decorrente de hipoperfusão; considerar pré-renal se não houver glomerulonefrite aguda, contraste recente ou rabdomiólise).`;
    }
    if (v > 2.0) {
      return `FeNa: ${v}% (>2,0% — Padrão renal intrínseco / necrose tubular aguda [NTA] com perda da capacidade tubular de reabsorção de sódio).`;
    }
    return `FeNa: ${v}% (Faixa indeterminada [1,0% a 2,0%] — interpretar em conjunto com história clínica, sedimento urinário e FeUreia).`;
  },
  populacaoAlvo: 'Adultos com dados séricos e urinários pareados para avaliação de lesão renal.',
  limitacoes: [
    'Interpretar idealmente com amostras sérica e urinária obtidas no mesmo período.',
    'Diuréticos e diversas doenças renais e sistêmicas podem alterar o valor.',
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
    if ((dados.sodio as number) <= 0) erros.push('Sódio sérico deve ser maior que zero.');
    if ((dados.creatinina as number) <= 0) erros.push('Creatinina sérica deve ser maior que zero.');
    if ((dados.sodio_urinario as number) < 0) erros.push('Sódio urinário não pode ser negativo.');
    if ((dados.creatinina_urinaria as number) <= 0) erros.push('Creatinina urinária deve ser maior que zero.');
    return erros;
  },
};
