import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

function campoVazio(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function resolverFiO2(d: ContextoPaciente): number | undefined {
  if (typeof d.fio2 === 'number' && Number.isFinite(d.fio2)) {
    return d.fio2;
  }
  if (d.o2_suplementar === false) {
    return 0.21;
  }
  return undefined;
}

function scoreBrain(gcs: number, delirium: boolean): number {
  if (gcs <= 5) return 4;
  if (gcs <= 8) return 3;
  if (gcs <= 12) return 2;
  if (gcs <= 14) return 1;
  return delirium ? 1 : 0;
}

interface ScoreRespResult {
  pontos: number | undefined;
  descricao: string;
  valor: number | null;
  insuficiente: boolean;
}

/**
 * Domínio respiratório do SOFA-2 (Moreno et al., JAMA Netw Open 2025; Ranzani et al., JAMA 2025).
 *
 * Regras metodológicas:
 * 1. ECMO confere 4 pontos diretamente.
 * 2. PaO₂/FiO₂ é o padrão-ouro primário para avaliação de troca gasosa.
 * 3. SpO₂/FiO₂ é alternativa validada exclusivamente para SpO₂ < 98% quando PaO₂ não estiver disponível.
 * 4. Para SpO₂ ≥ 98% sem PaO₂, o platô superior da curva de dissociação da oxiemoglobina inviabiliza
 *    a estimativa matemática da PaO₂. A calculadora NÃO quebra (sem throw), não inventa pontuação
 *    arbitrária de 0, mas sim reporta impossibilidade/insuficiência de dados com pontos indefinidos
 *    e alerta clínico explícito.
 */
function scoreResp(d: ContextoPaciente): ScoreRespResult {
  const ecmo = Boolean(d.ecmo_respiratorio || d.ecmo_cardiovascular);
  if (ecmo) {
    return { pontos: 4, descricao: 'ECMO → 4 pontos no domínio respiratório', valor: 4, insuficiente: false };
  }

  const fio2 = resolverFiO2(d);
  if (typeof fio2 !== 'number' || fio2 < 0.21 || fio2 > 1.0) {
    return {
      pontos: undefined,
      descricao: 'FiO₂ ausente ou inválida para cálculo do domínio respiratório',
      valor: null,
      insuficiente: true,
    };
  }

  const suporte = Boolean(d.suporte_ventilatorio_avancado);

  // 1. Prioridade: PaO2 arterial
  if (typeof d.pao2 === 'number' && Number.isFinite(d.pao2) && d.pao2 > 0) {
    const pf = d.pao2 / fio2;
    if (pf <= 75 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) {
      return { pontos: 4, descricao: 'PaO₂/FiO₂ ≤75 mmHg + suporte avançado → 4 pontos', valor: pf, insuficiente: false };
    }
    if (pf <= 150 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) {
      return { pontos: 3, descricao: 'PaO₂/FiO₂ ≤150 mmHg + suporte avançado → 3 pontos', valor: pf, insuficiente: false };
    }
    if (pf <= 225) {
      return { pontos: 2, descricao: 'PaO₂/FiO₂ ≤225 mmHg → 2 pontos', valor: pf, insuficiente: false };
    }
    if (pf <= 300) {
      return { pontos: 1, descricao: 'PaO₂/FiO₂ ≤300 mmHg → 1 ponto', valor: pf, insuficiente: false };
    }
    return { pontos: 0, descricao: 'PaO₂/FiO₂ >300 mmHg → 0 pontos', valor: pf, insuficiente: false };
  }

  // 2. Alternativa documental: SpO2/FiO2 exclusivamente quando SpO2 < 98%
  const spo2 = d.spo2;
  if (typeof spo2 === 'number' && Number.isFinite(spo2)) {
    if (spo2 < 98 && spo2 > 0) {
      const sf = spo2 / fio2;
      if (sf <= 120 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) {
        return { pontos: 4, descricao: 'SpO₂/FiO₂ ≤120 + suporte avançado → 4 pontos', valor: sf, insuficiente: false };
      }
      if (sf <= 200 && (suporte || d.suporte_ventilatorio_indisponivel_limite)) {
        return { pontos: 3, descricao: 'SpO₂/FiO₂ ≤200 + suporte avançado → 3 pontos', valor: sf, insuficiente: false };
      }
      if (sf <= 250) {
        return { pontos: 2, descricao: 'SpO₂/FiO₂ ≤250 → 2 pontos', valor: sf, insuficiente: false };
      }
      if (sf <= 300) {
        return { pontos: 1, descricao: 'SpO₂/FiO₂ ≤300 → 1 ponto', valor: sf, insuficiente: false };
      }
      return { pontos: 0, descricao: 'SpO₂/FiO₂ >300 → 0 pontos', valor: sf, insuficiente: false };
    }

    // SpO2 >= 98%: platô da oxiemoglobina sem PaO2 arterial
    return {
      pontos: undefined,
      descricao: 'Domínio respiratório não pontuável: SpO₂ em platô (≥98%) sem PaO₂ arterial. Conforme SOFA-2 (Moreno et al., 2025), SpO₂/FiO₂ só é aceita para SpO₂ < 98%.',
      valor: null,
      insuficiente: true,
    };
  }

  return {
    pontos: undefined,
    descricao: 'Domínio respiratório não pontuável: nem PaO₂ nem SpO₂ válidos informados.',
    valor: null,
    insuficiente: true,
  };
}

function scoreCardio(d: ContextoPaciente): { pontos: number; descricao: string; valor: number } {
  const map = ((d.pas as number) + 2 * (d.pad as number)) / 3;
  const norepi = Number(d.norepinefrina ?? 0);
  const epi = Number(d.epinefrina ?? 0);
  const dopamine = Number(d.dopamina ?? 0);
  const cate = norepi + epi;
  // Vasopressina em dose contínua U/min (faixa clínica usual 0,01 a 0,04 U/min)
  const vasopressinaUmin = Number(d.vasopressina ?? 0);
  const other =
    vasopressinaUmin > 0 ||
    Number(d.dobutamina ?? 0) > 0 ||
    Number(d.milrinona ?? 0) > 0 ||
    Boolean(d.sofa2_outro_vasoativo) ||
    (dopamine > 0 && cate > 0);
  const mechanical = Boolean(d.suporte_mecanico_cardiovascular) || Boolean(d.ecmo_cardiovascular);

  if (mechanical) return { pontos: 4, descricao: 'Suporte mecânico cardiovascular → 4 pontos', valor: map };
  if (cate > 0.4) return { pontos: 4, descricao: 'Noradrenalina + adrenalina >0,4 µg/kg/min → 4 pontos', valor: map };
  if (cate > 0.2 && cate <= 0.4) return { pontos: other ? 4 : 3, descricao: other ? 'Dose intermediária de noradrenalina + adrenalina + outro vasoativo/inotrópico (ex.: vasopressina U/min) → 4 pontos' : 'Noradrenalina + adrenalina >0,2–0,4 µg/kg/min → 3 pontos', valor: map };
  if (cate > 0 && cate <= 0.2) return { pontos: other ? 3 : 2, descricao: other ? 'Dose baixa de noradrenalina + adrenalina + outro vasoativo/inotrópico (ex.: vasopressina U/min) → 3 pontos' : 'Dose baixa de noradrenalina + adrenalina → 2 pontos', valor: map };
  if (cate === 0 && dopamine > 40 && !other) return { pontos: 4, descricao: 'Dopamina >40 µg/kg/min como único vasoativo → 4 pontos', valor: map };
  if (cate === 0 && dopamine > 20 && dopamine <= 40 && !other) return { pontos: 3, descricao: 'Dopamina >20–40 µg/kg/min como único vasoativo → 3 pontos', valor: map };
  if (cate === 0 && dopamine > 0 && dopamine <= 20 && !other) return { pontos: 2, descricao: 'Dopamina ≤20 µg/kg/min como único vasoativo → 2 pontos', valor: map };
  if (cate === 0 && other) return { pontos: 2, descricao: 'Outro vasopressor/inotrópico (ex.: vasopressina U/min) sem noradrenalina/adrenalina → 2 pontos', valor: map };

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
  tipoMetrica: 'escore',
  dominioClinico: 'gravidade',
  entradas: ['pas', 'pad', 'creatinina', 'bilirrubina', 'plaquetas', 'peso', 'gcs', 'delirium_tratamento'],
  obterEntradasFaltantes: (d) => {
    const faltando: string[] = [];
    const required = ['pas', 'pad', 'creatinina', 'bilirrubina', 'plaquetas', 'peso', 'gcs', 'delirium_tratamento'];
    for (const c of required) if (campoVazio(d[c])) faltando.push(c);

    const hasPaO2 = typeof d.pao2 === 'number' && Number.isFinite(d.pao2);
    const hasSpO2Alternative = typeof d.spo2 === 'number' && Number.isFinite(d.spo2) && d.spo2 < 98;
    const hasEcmo = Boolean(d.ecmo_respiratorio || d.ecmo_cardiovascular);

    if (!hasEcmo) {
      if (!hasPaO2 && !hasSpO2Alternative) {
        if (typeof d.spo2 === 'number' && d.spo2 >= 98) {
          faltando.push('pao2 (necessário quando SpO2 ≥ 98% devido ao platô da curva de saturação)');
        } else {
          faltando.push('pao2 ou spo2<98');
        }
      }

      if (d.o2_suplementar && campoVazio(d.fio2)) {
        faltando.push('fio2');
      }
    }

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
      {
        campo: 'respiratorio',
        valor: resp.valor !== null ? Number(resp.valor.toFixed(1)) : null,
        pontos: resp.pontos,
        descricao: resp.descricao,
      },
      { campo: 'cardiovascular', valor: Number(cardio.valor.toFixed(1)), pontos: cardio.pontos, descricao: cardio.descricao },
      { campo: 'hepatico', valor: d.bilirrubina, pontos: liver, descricao: `Bilirrubina total ${d.bilirrubina} mg/dL → ${liver} ponto(s)` },
      { campo: 'renal', valor: kidney.valor, pontos: kidney.pontos, descricao: kidney.descricao },
      { campo: 'hemostasia', valor: d.plaquetas, pontos: hemo, descricao: `Plaquetas ${d.plaquetas} ×10³/µL → ${hemo} ponto(s)` },
    ];

    const avisos: string[] = [
      'SOFA-2 foi desenvolvido e validado em pacientes adultos de UTI e mantém seis domínios: cérebro, respiratório, cardiovascular, fígado, rim e hemostasia.',
      'Na ausência de PaO₂, SpO₂/FiO₂ é a alternativa unicamente quando SpO₂ <98%. Suporte ventilatório avançado inclui HFNO, CPAP, BiPAP/NIV, ventilação mecânica invasiva e ventilação domiciliar prolongada. ECMO confere 4 pontos no domínio respiratório.',
      'A vasopressina é mensurada em infusão contínua (U/min, faixa clínica usual de 0,01 a 0,04 U/min) e computada como outro vasoativo no domínio cardiovascular.',
      'Dopamina possui cortes próprios quando usada como único vasopressor. Nitroprussiato e nitroglicerina não contam como vasopressores/inotrópicos para pontuação do SOFA-2.',
    ];

    if (resp.insuficiente) {
      avisos.push(
        'ATENÇÃO CLÍNICA: Domínio respiratório incompleto/insuficiente. ' + resp.descricao,
      );
    }

    const valor = detalhes.reduce((t, i) => t + (i.pontos ?? 0), 0);
    const respIncompleto = detalhes.some((d) => d.campo === 'respiratorio' && d.pontos === undefined);

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    if (valor >= 12) nivelGravidade = 'critico';
    else if (valor >= 6) nivelGravidade = 'alerta';
    else if (valor >= 2) nivelGravidade = 'atencao';

    const resumo = respIncompleto
      ? `SOFA-2 parcial: ${valor} pontos (domínio respiratório pendente)`
      : `SOFA-2 ${valor} pontos (${valor >= 12 ? 'Falência múltipla de órgãos grave' : valor >= 6 ? 'Disfunção orgânica moderada a grave' : valor >= 2 ? 'Disfunção orgânica leve a moderada' : 'Sem disfunção orgânica significativa'})`;

    return {
      valor,
      unidade: 'pontos',
      resumo,
      nivelGravidade,
      detalhamento: detalhes,
      avisos,
    };
  },
  interpretar: (r) => {
    const respIncompleto = r.detalhamento?.some((d) => d.campo === 'respiratorio' && d.pontos === undefined);
    if (respIncompleto) {
      return `SOFA-2 parcial: ${r.valor} pontos nos domínios calculáveis. O domínio respiratório requer gasometria com PaO₂ quando SpO₂ ≥ 98%.`;
    }
    const v = Number(r.valor);
    if (v >= 12) return `SOFA-2: ${v} pontos (Falência de múltiplos órgãos grave — elevada mortalidade em terapia intensiva [>50%]; suporte avançado e monitorização invasiva mandatórios).`;
    if (v >= 6) return `SOFA-2: ${v} pontos (Disfunção orgânica significativa — risco substancial de deterioração; considerar cuidados intensivos e suporte direcionado).`;
    if (v >= 2) return `SOFA-2: ${v} pontos (Disfunção orgânica leve a moderada — preenche critério de sepse se associado a infecção; monitorar evolução).`;
    return `SOFA-2: ${v} pontos (Sem evidência de disfunção orgânica aguda significativa nos 6 domínios avaliados).`;
  },
  populacaoAlvo: 'Adultos criticamente enfermos, especialmente em UTI.',
  limitacoes: [
    'Não deve ser tratado como escore pediátrico.',
    'A validade fora da UTI ainda não foi estabelecida pelo estudo de desenvolvimento.',
    'A relação SpO₂/FiO₂ não substitui PaO₂/FiO₂ quando SpO₂ ≥ 98%.',
  ],
  referencias: [
    { titulo: 'Moreno R et al. SOFA-2 consensus statement. JAMA Network Open. 2025;8(1):e2456488.', url: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2840786' },
    { titulo: 'Ranzani OT et al. Development and Validation of SOFA-2. JAMA. 2025;333(10):869-880.', url: 'https://doi.org/10.1001/jama.2025.20516' },
  ],
  versao: '2 (Consenso 2025/2026)',
  ultimaRevisao: '2026-10-29',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.gcs !== 'number' || d.gcs < 3 || d.gcs > 15) erros.push('GCS deve estar entre 3 e 15.');
    if (typeof d.fio2 === 'number' && (d.fio2 < 0.21 || d.fio2 > 1)) erros.push('FiO₂ deve estar entre 0,21 e 1,00.');
    if (typeof d.spo2 === 'number' && (d.spo2 < 0 || d.spo2 > 100)) erros.push('SpO₂ deve estar entre 0% e 100%.');
    if (typeof d.pao2 === 'number' && d.pao2 < 0) erros.push('PaO₂ não pode ser negativa.');
    if (typeof d.plaquetas !== 'number' || d.plaquetas < 0) erros.push('Plaquetas não podem ser negativas.');
    if (typeof d.creatinina !== 'number' || d.creatinina < 0) erros.push('Creatinina não pode ser negativa.');
    if (typeof d.bilirrubina !== 'number' || d.bilirrubina < 0) erros.push('Bilirrubina não pode ser negativa.');
    if (typeof d.pas === 'number' && d.pas <= 0) erros.push('Pressão arterial sistólica deve ser maior que zero.');
    if (typeof d.pad === 'number' && d.pad < 0) erros.push('Pressão arterial diastólica não pode ser negativa.');
    if (typeof d.vasopressina === 'number' && (d.vasopressina < 0 || d.vasopressina > 1.0)) {
      erros.push('Dose de vasopressina deve estar entre 0 e 1,0 U/min.');
    }
    return erros;
  },
};
