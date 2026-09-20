import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

function campoVazio(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function scoreBrain(gcs: number, delirium: boolean): number {
  if (gcs <= 5) return 4;
  if (gcs <= 8) return 3;
  if (gcs <= 12) return 2;
  if (gcs <= 14) return 1;
  return delirium ? 1 : 0;
}

function scoreResp(d: ContextoPaciente): { pontos: number; descricao: string; valor: number } {
  const fio2 = d.fio2 as number;
  const suporte = Boolean(d.suporte_ventilatorio_avancado);
  const ecmo = Boolean(d.ecmo_respiratorio || d.ecmo_cardiovascular);

  if (ecmo) return { pontos: 4, descricao: 'ECMO → 4 pontos no domínio respiratório', valor: 4 };
  if (typeof fio2 !== 'number' || fio2 < 0.21 || fio2 > 1) throw new Error('FiO₂ deve estar entre 0,21 e 1,00.');

  if (typeof d.pao2 === 'number') {
    const pf = d.pao2 / fio2;
    if (pf <= 75 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) return { pontos: 4, descricao: 'PaO₂/FiO₂ ≤75 + suporte avançado (ou indisponível/limite) → 4 pontos', valor: pf };
    if (pf <= 150 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) return { pontos: 3, descricao: 'PaO₂/FiO₂ ≤150 + suporte avançado (ou indisponível/limite) → 3 pontos', valor: pf };
    if (pf <= 225) return { pontos: 2, descricao: 'PaO₂/FiO₂ ≤225 → 2 pontos', valor: pf };
    if (pf <= 300) return { pontos: 1, descricao: 'PaO₂/FiO₂ ≤300 → 1 ponto', valor: pf };
    return { pontos: 0, descricao: 'PaO₂/FiO₂ >300 → 0 pontos', valor: pf };
  }

  const spo2 = d.spo2 as number;
  if (typeof spo2 !== 'number' || spo2 >= 98) throw new Error('Para usar SpO₂/FiO₂, informe SpO₂ <98% quando PaO₂ estiver indisponível.');
  const sf = spo2 / fio2;
  if (sf <= 120 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) return { pontos: 4, descricao: 'SpO₂/FiO₂ ≤120 + suporte avançado (ou indisponível/limite) → 4 pontos', valor: sf };
  if (sf <= 200 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) return { pontos: 3, descricao: 'SpO₂/FiO₂ ≤200 + suporte avançado (ou indisponível/limite) → 3 pontos', valor: sf };
  if (sf <= 250) return { pontos: 2, descricao: 'SpO₂/FiO₂ ≤250 → 2 pontos', valor: sf };
  if (sf <= 300) return { pontos: 1, descricao: 'SpO₂/FiO₂ ≤300 → 1 ponto', valor: sf };
  return { pontos: 0, descricao: 'SpO₂/FiO₂ >300 → 0 pontos', valor: sf };
}

function scoreCardio(d: ContextoPaciente): { pontos: number; descricao: string; valor: number } {
  const map = ((d.pas as number) + 2 * (d.pad as number)) / 3;
  const norepi = Number(d.norepinefrina ?? 0);
  const epi = Number(d.epinefrina ?? 0);
  const dopamine = Number(d.dopamina ?? 0);
  const cate = norepi + epi;
  const other =
    Number(d.vasopressina ?? 0) > 0 ||
    Number(d.dobutamina ?? 0) > 0 ||
    Number(d.milrinona ?? 0) > 0 ||
    Boolean(d.sofa2_outro_vasoativo) ||
    (dopamine > 0 && cate > 0);
  const mechanical = Boolean(d.suporte_mecanico_cardiovascular) || Boolean(d.ecmo_cardiovascular);

  if (mechanical) return { pontos: 4, descricao: 'Suporte mecânico cardiovascular → 4 pontos', valor: map };
  if (cate > 0.4) return { pontos: 4, descricao: 'Noradrenalina + adrenalina >0,4 µg/kg/min → 4 pontos', valor: map };
  if (cate > 0.2 && cate <= 0.4) return { pontos: other ? 4 : 3, descricao: other ? 'Dose média de noradrenalina + adrenalina + outro vasoativo/inotrópico → 4 pontos' : 'Noradrenalina + adrenalina >0,2–0,4 µg/kg/min → 3 pontos', valor: map };
  if (cate > 0 && cate <= 0.2) return { pontos: other ? 3 : 2, descricao: other ? 'Dose baixa de noradrenalina + adrenalina + outro vasoativo/inotrópico → 3 pontos' : 'Dose baixa de noradrenalina + adrenalina → 2 pontos', valor: map };
  if (cate === 0 && dopamine > 40 && !other) return { pontos: 4, descricao: 'Dopamina >40 µg/kg/min como único vasoativo → 4 pontos', valor: map };
  if (cate === 0 && dopamine > 20 && dopamine <= 40 && !other) return { pontos: 3, descricao: 'Dopamina >20–40 µg/kg/min como único vasoativo → 3 pontos', valor: map };
  if (cate === 0 && dopamine > 0 && dopamine <= 20 && !other) return { pontos: 2, descricao: 'Dopamina ≤20 µg/kg/min como único vasoativo → 2 pontos', valor: map };
  if (cate === 0 && other) return { pontos: 2, descricao: 'Outro vasopressor/inotrópico sem noradrenalina/adrenalina → 2 pontos', valor: map };

  if (d.sofa2_vasoativos_indisponiveis_limite) {
    if (map < 40) return { pontos: 4, descricao: 'MAP <40 mmHg; vasoativos indisponíveis/limite terapêutico → 4 pontos', valor: map };
    if (map < 50) return { pontos: 3, descricao: 'MAP 40–49 mmHg; vasoativos indisponíveis/limite terapêutico → 3 pontos', valor: map };
    if (map < 60) return { pontos: 2, descricao: 'MAP 50–59 mmHg; vasoativos indisponíveis/limite terapêutico → 2 pontos', valor: map };
    if (map < 70) return { pontos: 1, descricao: 'MAP 60–69 mmHg; vasoativos indisponíveis/limite terapêutico → 1 ponto', valor: map };
  }

  return { pontos: map < 70 ? 1 : 0, descricao: map < 70 ? 'MAP <70 mmHg, sem vasoativo → 1 ponto' : 'MAP ≥70 mmHg, sem vasoativo → 0 pontos', valor: map };
}

function scoreKidney(d: ContextoPaciente): { pontos: number; descricao: string; valor: string } {
  const cr = d.creatinina as number;
  const peso = d.peso as number;
  const totalMl = d.diurese_ml as number | undefined;
  const horas = d.diurese_horas as number | undefined;

  if (d.terapia_renal_substitutiva || d.indicacao_trs_sem_trs) return { pontos: 4, descricao: 'TRS recebida ou critérios para TRS registrados → 4 pontos', valor: `${cr.toFixed(2)} mg/dL` };

  let urineScore = 0;
  if (typeof totalMl === 'number' && typeof horas === 'number' && horas > 0 && peso > 0) {
    const mlKgH = totalMl / horas / peso;
    if (totalMl === 0 && horas >= 12) urineScore = 3;
    else if (mlKgH < 0.3 && horas >= 24) urineScore = 3;
    else if (mlKgH < 0.5 && horas >= 12) urineScore = 2;
    else if (mlKgH < 0.5 && horas >= 6) urineScore = 1;
  }

  let crScore = 0;
  if (cr > 3.5) crScore = 3;
  else if (cr > 2) crScore = 2;
  else if (cr > 1.2) crScore = 1;

  return {
    pontos: Math.max(crScore, urineScore),
    descricao: `Creatinina ${cr.toFixed(2)} mg/dL${urineScore ? `; diurese ${urineScore} ponto(s)` : ''} → ${Math.max(crScore, urineScore)} ponto(s)`,
    valor: `${cr.toFixed(2)} mg/dL`,
  };
}

export const sofa2: Calculadora = {
  id: 'sofa-2',
  nome: 'SOFA-2',
  categoria: 'disfuncao organica',
  entradas: ['pas', 'pad', 'creatinina', 'bilirrubina', 'plaquetas', 'peso', 'gcs', 'delirium_tratamento', 'fio2', 'suporte_ventilatorio_avancado', 'ecmo_respiratorio'],
  obterEntradasFaltantes: (d) => {
    const faltando: string[] = [];
    const required = ['pas', 'pad', 'creatinina', 'bilirrubina', 'plaquetas', 'peso', 'gcs', 'delirium_tratamento'];
    for (const c of required) if (campoVazio(d[c])) faltando.push(c);

    const hasPaO2 = typeof d.pao2 === 'number';
    const hasSpO2Alternative = typeof d.spo2 === 'number' && d.spo2 < 98;
    if (!hasPaO2 && !hasSpO2Alternative) faltando.push('pao2 ou spo2<98');

    if (d.o2_suplementar && campoVazio(d.fio2)) faltando.push('fio2');
    if (!d.o2_suplementar && campoVazio(d.fio2)) d.fio2 = 0.21;

    if (d.vasoativos_em_uso) {
      const drugKnown = ['norepinefrina', 'epinefrina', 'dopamina', 'vasopressina', 'dobutamina', 'milrinona'].some((c) => Number(d[c] ?? 0) > 0);
      if (!drugKnown && !d.sofa2_vasoativos_indisponiveis_limite) faltando.push('dose de vasoativo');
      if (campoVazio(d.vasoativos_continuos_1h)) faltando.push('vasoativo contínuo ≥1 h');
    } else if (campoVazio(d.vasoativos_em_uso) && campoVazio(d.sofa2_vasoativos_indisponiveis_limite)) {
      faltando.push('uso de vasoativos ou limite terapêutico');
    }
    if (typeof d.diurese_ml === 'number' && campoVazio(d.diurese_horas)) faltando.push('diurese_horas');
    return [...new Set(faltando)];
  },
  calcular: (d): ResultadoCalculadora => {
    const cerebral = scoreBrain(d.gcs as number, Boolean(d.delirium_tratamento));
    const resp = scoreResp(d);
    const cardio = scoreCardio(d);
    const liver = (d.bilirrubina as number) <= 1.2 ? 0 : (d.bilirrubina as number) <= 3 ? 1 : (d.bilirrubina as number) <= 6 ? 2 : (d.bilirrubina as number) <= 12 ? 3 : 4;
    const kidney = scoreKidney(d);
    const hemo = (d.plaquetas as number) > 150 ? 0 : (d.plaquetas as number) > 100 ? 1 : (d.plaquetas as number) > 80 ? 2 : (d.plaquetas as number) > 50 ? 3 : 4;

    const detalhes: DetalheCalculo[] = [
      { campo: 'brain', valor: d.gcs, pontos: cerebral, descricao: `Cérebro — GCS ${d.gcs}${d.delirium_tratamento ? ' + tratamento farmacológico de delirium' : ''}` },
      { campo: 'respiratorio', valor: Number(resp.valor.toFixed(1)), pontos: resp.pontos, descricao: resp.descricao },
      { campo: 'cardiovascular', valor: Number(cardio.valor.toFixed(1)), pontos: cardio.pontos, descricao: cardio.descricao },
      { campo: 'hepatico', valor: d.bilirrubina, pontos: liver, descricao: `Bilirrubina total ${d.bilirrubina} mg/dL → ${liver} ponto(s)` },
      { campo: 'renal', valor: kidney.valor, pontos: kidney.pontos, descricao: kidney.descricao },
      { campo: 'hemostasia', valor: d.plaquetas, pontos: hemo, descricao: `Plaquetas ${d.plaquetas} ×10³/µL → ${hemo} ponto(s)` },
    ];

    const valor = detalhes.reduce((t, i) => t + (i.pontos ?? 0), 0);
    return {
      valor,
      unidade: 'pontos',
      detalhamento: detalhes,
      avisos: [
        'SOFA-2 foi desenvolvido e validado em pacientes adultos de UTI e mantém seis domínios: cérebro, respiratório, cardiovascular, fígado, rim e hemostasia.',
        'Na ausência de PaO₂, SpO₂/FiO₂ é a alternativa quando SpO₂ <98%. Suporte ventilatório avançado inclui HFNO, CPAP, BiPAP/NIV, ventilação mecânica invasiva e ventilação domiciliar prolongada. ECMO conta com 4 pontos no domínio respiratório.',
        'Dopamina tem cortes próprios quando usada como único vasopressor. Nitroprussiato e nitroglicerina são registrados na ficha, mas não são contabilizados automaticamente como “outro vasopressor/inotrópico” do SOFA-2.',
      ],
    };
  },
  interpretar: (r) => `SOFA-2: ${r.valor} pontos. O escore descreve disfunção de seis sistemas orgânicos e é destinado a adultos em cuidados críticos.`,
  populacaoAlvo: 'Adultos criticamente enfermos, especialmente em UTI.',
  limitacoes: [
    'Não deve ser tratado como escore pediátrico.',
    'A validade fora da UTI ainda não foi estabelecida pelo estudo de desenvolvimento.',
  ],
  referencias: [
    { titulo: 'Moreno R et al. SOFA-2 consensus statement. JAMA Network Open. 2025; corrigido em 2026.', url: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2840786' },
    { titulo: 'Ranzani OT et al. Development and Validation of SOFA-2. JAMA. 2025.', url: 'https://doi.org/10.1001/jama.2025.20516' },
  ],
  versao: '2',
  ultimaRevisao: '2026-09-19',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.gcs !== 'number' || d.gcs < 3 || d.gcs > 15) erros.push('GCS deve estar entre 3 e 15.');
    if (typeof d.fio2 !== 'number' || d.fio2 < 0.21 || d.fio2 > 1) erros.push('FiO₂ deve estar entre 0,21 e 1,00.');
    if (typeof d.plaquetas !== 'number' || d.plaquetas < 0) erros.push('Plaquetas não podem ser negativas.');
    return erros;
  },
};
