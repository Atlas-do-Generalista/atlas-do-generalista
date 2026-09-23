import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const deltaGap: Calculadora = {
  id: 'delta-gap',
  nome: 'Delta gap',
  categoria: 'laboratorio metabolico',
  entradas: ['sodio', 'cloro', 'hco3', 'albumina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const ag = (dados.sodio as number) - ((dados.cloro as number) + (dados.hco3 as number));
    const agCorrigido = ag + 2.5 * (4 - (dados.albumina as number));
    const deltaAg = agCorrigido - 12;
    const deltaHco3 = 24 - (dados.hco3 as number);
    const valor = deltaAg - deltaHco3;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mEq/L',
      detalhamento: [
        { campo: 'ag_corrigido', valor: Number(agCorrigido.toFixed(1)), descricao: 'Ânion gap corrigido por albumina' },
        { campo: 'delta_ag', valor: Number(deltaAg.toFixed(1)), descricao: 'ΔÂnion gap (AGc − 12)' },
        { campo: 'delta_hco3', valor: Number(deltaHco3.toFixed(1)), descricao: 'ΔHCO₃⁻ (24 − HCO₃⁻)' },
      ],
      avisos: [
        'O delta gap é uma ferramenta de apoio para reconhecer distúrbios metabólicos mistos; a interpretação depende do contexto e das premissas sobre AG e HCO₃⁻ normais.',
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
