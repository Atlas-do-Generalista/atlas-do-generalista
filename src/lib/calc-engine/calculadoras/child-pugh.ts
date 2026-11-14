import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

function scoreBili(v: number): number { return v < 2 ? 1 : v <= 3 ? 2 : 3; }
function scoreAlb(v: number): number { return v > 3.5 ? 1 : v >= 2.8 ? 2 : 3; }
function scoreInr(v: number): number { return v < 1.7 ? 1 : v <= 2.3 ? 2 : 3; }
function scoreAscite(v: ContextoPaciente['ascite']): number { return v === 'nenhuma' ? 1 : v === 'leve_moderada_responsiva' ? 2 : 3; }
function scoreEncefalopatia(v: ContextoPaciente['encefalopatia_hepatica']): number { return v === 'nenhuma' ? 1 : v === 'grau_1_2' ? 2 : 3; }

export const childPugh: Calculadora = {
  id: 'child-pugh',
  nome: 'Child-Pugh (CTP)',
  categoria: 'funcao hepatica',
  tipoMetrica: 'classificacao',
  dominioClinico: 'hepatica',
  entradas: ['bilirrubina', 'albumina', 'inr', 'ascite', 'encefalopatia_hepatica'],
  calcular: (d): ResultadoCalculadora => {
    const b = scoreBili(d.bilirrubina as number);
    const a = scoreAlb(d.albumina as number);
    const i = scoreInr(d.inr as number);
    const as = scoreAscite(d.ascite);
    const e = scoreEncefalopatia(d.encefalopatia_hepatica);
    const valor = b + a + i + as + e;
    const classe = valor <= 6 ? 'A' : valor <= 9 ? 'B' : 'C';

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    let descricaoPrognostica = '';

    if (classe === 'A') {
      nivelGravidade = 'normal';
      descricaoPrognostica = 'Cirrose compensada (mortalidade perioperatória ~10%)';
    } else if (classe === 'B') {
      nivelGravidade = 'alerta';
      descricaoPrognostica = 'Comprometimento funcional moderado (mortalidade perioperatória ~30%)';
    } else {
      nivelGravidade = 'critico';
      descricaoPrognostica = 'Descompensação avançada (mortalidade perioperatória >50–80%)';
    }

    const detalhes: DetalheCalculo[] = [
      { campo: 'bilirrubina', valor: d.bilirrubina, pontos: b, descricao: `Bilirrubina total (${d.bilirrubina} mg/dL)` },
      { campo: 'albumina', valor: d.albumina, pontos: a, descricao: `Albumina sérica (${d.albumina} g/dL)` },
      { campo: 'inr', valor: d.inr, pontos: i, descricao: `INR (${d.inr})` },
      { campo: 'ascite', valor: d.ascite, pontos: as, descricao: `Ascite (${d.ascite})` },
      { campo: 'encefalopatia', valor: d.encefalopatia_hepatica, pontos: e, descricao: `Encefalopatia hepática (${d.encefalopatia_hepatica})` },
    ];

    return {
      valor,
      unidade: 'pontos',
      resumo: `CTP ${valor}${classe}`,
      nivelGravidade,
      detalhamento: detalhes,
      avisos: [
        'O escore de Child-Turcotte-Pugh estratifica a gravidade funcional da cirrose hepática crônica e a sobrevida em 1 a 2 anos, além de orientar risco cirúrgico.',
        'Dois dos cinco critérios (ascite e encefalopatia) possuem avaliação semiológica e podem ser mascarados pelo uso de diuréticos e lactulose.',
      ],
    };
  },
  interpretar: (r) => {
    const v = Number(r.valor);
    const classe = v <= 6 ? 'Classe A' : v <= 9 ? 'Classe B' : 'Classe C';
    if (v <= 6) {
      return `Child-Pugh: ${v} pontos (${classe} — Cirrose hepática compensada; bom prognóstico com sobrevida em 1 ano de ~100% e mortalidade cirúrgica ~10%).`;
    }
    if (v <= 9) {
      return `Child-Pugh: ${v} pontos (${classe} — Comprometimento funcional hepático moderado; sobrevida em 1 ano de ~80% e mortalidade cirúrgica ~30%).`;
    }
    return `Child-Pugh: ${v} pontos (${classe} — Doença hepática crônica gravemente descompensada; sobrevida em 1 ano de ~45% e elevado risco cirúrgico [mortalidade >50–80%]).`;
  },
  populacaoAlvo: 'Adultos com cirrose ou doença hepática crônica para estimativa de gravidade funcional e risco cirúrgico.',
  limitacoes: [
    'Não é um escore aplicável para insuficiência hepática aguda sem cirrose preexistente.',
    'Apresenta efeito teto e depende de componentes semiológicos com potencial variabilidade interobservador.',
  ],
  referencias: [
    {
      titulo: 'Pugh RN et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-649.',
      url: 'https://doi.org/10.1002/bjs.1800600817',
    },
  ],
  versao: 'Pugh 1973',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const e: string[] = [];
    if ((d.bilirrubina as number) < 0) e.push('Bilirrubina não pode ser negativa.');
    if ((d.albumina as number) <= 0) e.push('Albumina deve ser maior que zero.');
    if ((d.inr as number) <= 0) e.push('INR deve ser maior que zero.');
    return e;
  },
};
