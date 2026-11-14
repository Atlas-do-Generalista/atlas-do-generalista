import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const feureia: Calculadora = {
  id: 'fe-ureia',
  nome: 'Fração de excreção de ureia (FeUreia)',
  categoria: 'funcao renal',
  tipoMetrica: 'indice',
  dominioClinico: 'renal',
  entradas: ['ureia', 'creatinina', 'ureia_urinaria', 'creatinina_urinaria'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const ureia = dados.ureia as number;
    const cr = dados.creatinina as number;
    const uUreia = dados.ureia_urinaria as number;
    const uCr = dados.creatinina_urinaria as number;
    const valor = ((uUreia * cr) / (ureia * uCr)) * 100;

    const nivelGravidade: 'normal' | 'atencao' | 'alerta' = valor > 50.0 ? 'alerta' : valor < 35.0 ? 'atencao' : 'normal';

    return {
      valor: Number(valor.toFixed(2)),
      unidade: '%',
      resumo: `FeUreia ${valor.toFixed(2)}% (${valor < 35.0 ? 'Padrão pré-renal' : valor > 50.0 ? 'Padrão NTA / intrínseco' : 'Indeterminado'})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'ureia', valor: ureia, descricao: 'Ureia sérica (mg/dL)' },
        { campo: 'creatinina', valor: cr, descricao: 'Creatinina sérica (mg/dL)' },
        { campo: 'ureia_urinaria', valor: uUreia, descricao: 'Ureia urinária (mg/dL)' },
        { campo: 'creatinina_urinaria', valor: uCr, descricao: 'Creatinina urinária (mg/dL)' },
      ],
      avisos: [
        'A fração de excreção de ureia é especialmente útil quando o paciente está em uso de diuréticos (ex.: furosemida), pois a ureia é reabsorvida no túbulo proximal e sofre menos interferência direta de diuréticos de alça do que a excreção de sódio.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 35.0) {
      return `FeUreia: ${v}% (<35,0% — Padrão pré-renal / retenção prerenal. Especialmente útil quando o paciente está em uso recente de diuréticos de alça, situação em que a FeNa pode estar falsamente elevada).`;
    }
    if (v > 50.0) {
      return `FeUreia: ${v}% (>50,0% — Padrão renal intrínseco / necrose tubular aguda [NTA]).`;
    }
    return `FeUreia: ${v}% (Faixa intermediária [35,0% a 50,0%] — interpretar com o contexto volêmico e sedimento urinário).`;
  },
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
