import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

export const albi: Calculadora = {
  id: 'albi',
  nome: 'ALBI (Albumin-Bilirubin)',
  categoria: 'funcao hepatica',
  entradas: ['bilirrubina', 'albumina'],
  calcular: (d): ResultadoCalculadora => {
    const biliMg = d.bilirrubina as number;
    const albuminaGdl = d.albumina as number;
    const biliUmol = biliMg * 17.104;
    const albuminaGl = albuminaGdl * 10;
    const score = 0.66 * Math.log10(biliUmol) - 0.0852 * albuminaGl;
    const valor = Number(score.toFixed(2));
    const grau = valor <= -2.60 ? 1 : valor <= -1.39 ? 2 : 3;
    const detalhes: DetalheCalculo[] = [
      { campo: 'bilirrubina', valor: biliMg, descricao: `Bilirrubina total (${biliUmol.toFixed(1)} µmol/L)` },
      { campo: 'albumina', valor: albuminaGdl, descricao: `Albumina (${albuminaGl.toFixed(1)} g/L)` },
      { campo: 'albi', valor, descricao: `ALBI = ${valor} → grau ${grau}` },
    ];
    return {
      valor,
      unidade: `grau ${grau}`,
      resumo: `ALBI ${valor} G${grau}`,
      detalhamento: detalhes,
      avisos: ['O ALBI foi originalmente desenvolvido para avaliação objetiva da função hepática em hepatocarcinoma; sua aplicação fora desse contexto exige interpretação da população em que foi validado.'],
    };
  },
  interpretar: (r) => `ALBI: ${r.valor} (${r.unidade}).`,
  populacaoAlvo: 'Adultos com bilirrubina e albumina disponíveis; originalmente desenvolvido em hepatocarcinoma.',
  limitacoes: ['Não substitui avaliação clínica de insuficiência hepática.', 'O significado prognóstico varia conforme a população estudada.'],
  referencias: [{ titulo: 'Johnson PJ et al. Assessment of liver function in patients with hepatocellular carcinoma: the ALBI grade. J Clin Oncol. 2015.', url: 'https://pubmed.ncbi.nlm.nih.gov/25512453/' }],
  versao: 'ALBI',
  ultimaRevisao: '2026-09-19',
  validar: (d) => {
    const e: string[] = [];
    if ((d.bilirrubina as number) <= 0) e.push('Bilirrubina deve ser maior que zero para o logaritmo do ALBI.');
    if ((d.albumina as number) <= 0) e.push('Albumina deve ser maior que zero.');
    return e;
  },
};
