import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const deltaGap: Calculadora = {
  id: 'delta-gap',
  nome: 'Delta gap',
  categoria: 'laboratorio metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'gasometria',
  entradas: ['sodio', 'cloro', 'hco3', 'albumina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const ag = (dados.sodio as number) - ((dados.cloro as number) + (dados.hco3 as number));
    const agCorrigido = ag + 2.5 * (4 - (dados.albumina as number));
    const deltaAg = agCorrigido - 12;
    const deltaHco3 = 24 - (dados.hco3 as number);
    const valor = Number((deltaAg - deltaHco3).toFixed(1));

    let interpretacaoBreve = 'Compatível com acidose de AG elevado pura';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' = 'normal';
    if (valor > 6) {
      interpretacaoBreve = 'Sugere alcalose metabólica associada';
      nivelGravidade = 'atencao';
    } else if (valor < -6) {
      interpretacaoBreve = 'Sugere acidose hiperclorêmica associada';
      nivelGravidade = 'atencao';
    }

    return {
      valor,
      unidade: 'mEq/L',
      resumo: `Delta gap ${valor} mEq/L (${interpretacaoBreve})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'ag_corrigido', valor: Number(agCorrigido.toFixed(1)), descricao: 'Ânion gap corrigido por albumina' },
        { campo: 'delta_ag', valor: Number(deltaAg.toFixed(1)), descricao: 'ΔÂnion gap (AGc − 12)' },
        { campo: 'delta_hco3', valor: Number(deltaHco3.toFixed(1)), descricao: 'ΔHCO₃⁻ (24 − HCO₃⁻)' },
      ],
      avisos: [
        'O delta gap (ΔAG − ΔHCO₃⁻) é uma ferramenta para desmascarar distúrbios metabólicos mistos quando há acidose com ânion gap aumentado.',
        'Valor > +6 mEq/L sugere alcalose metabólica concomitante (o bicarbonato não caiu na proporção esperada do aumento de ânions orgânicos).',
        'Valor < −6 mEq/L sugere acidose metabólica hiperclorêmica concomitante (o bicarbonato caiu mais do que o aumento do ânion gap).',
      ],
    };
  },
  interpretar: (resultado) => {
    if (resultado.valor > 6) return `Delta gap: ${resultado.valor} mEq/L. Valor positivo >6 pode sugerir alcalose metabólica concomitante.`;
    if (resultado.valor < -6) return `Delta gap: ${resultado.valor} mEq/L. Valor negativo <−6 pode sugerir acidose metabólica hiperclorêmica concomitante.`;
    return `Delta gap: ${resultado.valor} mEq/L. Faixa intermediária, sem evidência isolada forte de distúrbio metabólico misto por este parâmetro.`;
  },
  populacaoAlvo: 'Adultos com suspeita de distúrbio metabólico e dados necessários para ânion gap corrigido.',
  limitacoes: [
    'A equação pressupõe AG normal de 12 mEq/L e HCO₃⁻ normal de 24 mEq/L.',
    'Para hipoalbuminemia, esta implementação usa o AG corrigido por albumina antes do delta.',
  ],
  referencias: [
    {
      titulo: 'The delta (Δ) gap: An approach to mixed acid-base disorders. Ann Emerg Med. 1990.',
      url: 'https://doi.org/10.1016/S0196-0644(05)82292-9',
    },
    {
      titulo: 'Modified Delta Gap Equation for Quick Evaluation of Mixed Metabolic Acid-Base Disorders',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3562975/',
    },
  ],
  versao: 'AG corrigido por albumina; Δgap = ΔAG − ΔHCO₃',
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
