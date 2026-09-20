import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

function scoreBili(v: number): number { return v < 2 ? 1 : v <= 3 ? 2 : 3; }
function scoreAlb(v: number): number { return v > 3.5 ? 1 : v >= 2.8 ? 2 : 3; }
function scoreInr(v: number): number { return v < 1.7 ? 1 : v <= 2.3 ? 2 : 3; }
function scoreAscite(v: ContextoPaciente['ascite']): number { return v === 'nenhuma' ? 1 : v === 'leve_moderada_responsiva' ? 2 : 3; }
function scoreEncefalopatia(v: ContextoPaciente['encefalopatia_hepatica']): number { return v === 'nenhuma' ? 1 : v === 'grau_1_2' ? 2 : 3; }

export const childPugh: Calculadora = {
  id: 'child-pugh',
  nome: 'Child-Pugh',
  categoria: 'funcao hepatica',
  entradas: ['bilirrubina', 'albumina', 'inr', 'ascite', 'encefalopatia_hepatica'],
  calcular: (d): ResultadoCalculadora => {
    const b = scoreBili(d.bilirrubina as number);
    const a = scoreAlb(d.albumina as number);
    const i = scoreInr(d.inr as number);
    const as = scoreAscite(d.ascite);
    const e = scoreEncefalopatia(d.encefalopatia_hepatica);
    const valor = b + a + i + as + e;
    const classe = valor <= 6 ? 'A' : valor <= 9 ? 'B' : 'C';
    const detalhes: DetalheCalculo[] = [
      { campo: 'bilirrubina', valor: d.bilirrubina, pontos: b, descricao: 'Bilirrubina total' },
      { campo: 'albumina', valor: d.albumina, pontos: a, descricao: 'Albumina' },
      { campo: 'inr', valor: d.inr, pontos: i, descricao: 'INR' },
      { campo: 'ascite', valor: d.ascite, pontos: as, descricao: 'Ascite' },
      { campo: 'encefalopatia', valor: d.encefalopatia_hepatica, pontos: e, descricao: 'Encefalopatia hepática' },
    ];
    return {
      valor,
      unidade: 'pontos',
      resumo: `CTP ${valor}${classe}`,
      detalhamento: detalhes,
      avisos: ['O Child-Pugh é um escore prognóstico de gravidade de cirrose e inclui dois componentes clínicos subjetivos: ascite e encefalopatia.'],
    };
  },
  interpretar: (r) => `Child-Pugh: ${r.valor} pontos (${r.resumo?.slice(-1) ?? 'classe não informada'}).`,
  populacaoAlvo: 'Adultos com cirrose/doença hepática crônica em que se deseja estimar gravidade.',
  limitacoes: ['Não é um escore específico de insuficiência hepática aguda.', 'Ascite e encefalopatia têm componente subjetivo.'],
  referencias: [{ titulo: 'VA Viral Hepatitis and Liver Disease — Child-Turcotte-Pugh Calculator', url: 'https://www.hepatitis.va.gov/provider/tools/child-pugh-calculator.asp' }],
  versao: '5 componentes',
  ultimaRevisao: '2026-09-19',
  validar: (d) => {
    const e: string[] = [];
    if ((d.bilirrubina as number) < 0) e.push('Bilirrubina não pode ser negativa.');
    if ((d.albumina as number) <= 0) e.push('Albumina deve ser maior que zero.');
    if ((d.inr as number) <= 0) e.push('INR deve ser maior que zero.');
    return e;
  },
};
