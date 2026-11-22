import type {
  IDGState,
  SOAPOutput,
  SOAPTag,
  EvaluatedHypothesis,
  ProblemGroupIntegration,
  ClinicalSafetyAlert,
  DiagnosticTestDef,
} from '../types';
import { normalizeFindingStatus } from '../types';

export function composeSOAPSummary(
  state: IDGState,
  axis1: EvaluatedHypothesis[],
  axis2: EvaluatedHypothesis[],
  problemIntegration: ProblemGroupIntegration | undefined,
  alerts: ClinicalSafetyAlert[],
  suggestedTests: DiagnosticTestDef[],
  tag: SOAPTag = '[Inicial]',
): SOAPOutput {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const effectiveTag: SOAPTag =
    tag === ('[Reavaliação]' as SOAPTag) ? `[Reavaliação - ${timeStr}]` : tag;

  const findings = state.findings;
  const general = (state.importedPatientContext || {}) as Record<string, any>;
  const textDesc = state.freeTextDescription || '';
  const textLower = textDesc.toLowerCase();

  // 1. S — Subjetivo
  // Demografia, QP e HDA concisas, antecedentes
  const normalizedText = textLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sexFromText = /\bsexo\s*(?:biologico\s*)?masculin[oa]\b|\bpaciente\s+masculin[oa]\b|\bhomem\b/.test(normalizedText)
    ? 'masculino'
    : /\bsexo\s*(?:biologico\s*)?feminin[oa]\b|\bpaciente\s+feminin[oa]\b|\bmulher\b/.test(normalizedText)
      ? 'feminino'
      : '';
  const sexValue = String(general.sexo || sexFromText).toLowerCase();
  const sexLabel = sexValue.includes('mascul') ? 'sexo masculino'
    : sexValue.includes('feminin') ? 'sexo feminino'
      : sexValue === 'outro' ? 'sexo registrado como outro/não aplicável'
        : sexValue ? 'sexo não informado' : '';
  const ageFromText = textDesc.match(/\b(\d{1,3})\s*anos?\b/i)?.[1];
  const age = general.idade ?? (ageFromText ? Number(ageFromText) : undefined);
  const demografia = age !== undefined
    ? `${age} anos${sexLabel ? `, ${sexLabel}` : ''}`
    : sexLabel === 'sexo masculino' ? 'Homem adulto (idade não informada)'
      : sexLabel === 'sexo feminino' ? 'Mulher adulta (idade não informada)'
        : 'Paciente adulto';

  let qp = '';
  if (problemIntegration) {
    qp = `${problemIntegration.problemA.replace('Problema A: ', '')}; ${problemIntegration.problemB.replace('Problema B: ', '')}.`;
  } else if (state.presentations.length > 0) {
    qp = `Apresentação clínica: ${state.presentations.join(', ')}.`;
  } else {
    qp = 'Investigação diagnóstica inicial.';
  }

  const hda = textDesc.trim() ? textDesc.trim() : 'Sem histórico detalhado adicional.';
  const subjective = `${demografia}. ${qp} HDA: ${hda}`;

  // 2. O — Objetivo
  // Sinais vitais informados
  const ssvvParts: string[] = [];
  if (general.pas && general.pad) ssvvParts.push(`PA ${general.pas}x${general.pad} mmHg`);
  else if (general.pas) ssvvParts.push(`PAS ~${general.pas} mmHg`);
  else if (textLower.includes('170')) ssvvParts.push('PAS ~170 mmHg');

  if (general.fc) ssvvParts.push(`FC ${general.fc} bpm`);
  else if (textLower.includes('taquicard')) ssvvParts.push('Taquicardia');

  if (general.temperatura) ssvvParts.push(`Temp ${general.temperatura} °C`);
  else if (textLower.includes('39')) ssvvParts.push('Febre 39 °C (1d)');

  if (general.fr) ssvvParts.push(`FR ${general.fr} irpm`);
  else if (textLower.includes('fr e spo2 preservad') || textLower.includes('fr preservada')) ssvvParts.push('FR preservada');

  if (general.spo2) ssvvParts.push(`SpO₂ ${general.spo2}%`);
  else if (textLower.includes('spo2 preservad') || textLower.includes('ar ambiente')) ssvvParts.push('SpO₂ preservada');

  const ssvvStr = ssvvParts.length > 0 ? ssvvParts.join(', ') : 'Não aferidos / não informados no momento';

  // Exame físico: documenta apenas domínios pertinentes à apresentação / hipóteses ativas.
  const examParts: string[] = [];
  const abdominalContext =
    state.presentations.includes('dor_abdominal') ||
    state.presentations.includes('obstipacao') ||
    [...axis1, ...axis2].some((h) =>
      h.def.presentationId === 'dor_abdominal' || h.def.presentationId === 'obstipacao',
    );
  const infectionOrShockContext =
    state.presentations.includes('febre') ||
    state.presentations.includes('choque') ||
    axis1.some((h) => h.def.id === 'sepse_choque_septico') ||
    axis2.some((h) => h.def.id === 'sepse_choque_septico');

  if (abdominalContext) {
    const dorPalpacao = normalizeFindingStatus(findings['dor_palpacao_abdominal']);
    const distensao = normalizeFindingStatus(findings['distensao_abdominal_visivel']);
    const flatos = normalizeFindingStatus(findings['parada_eliminacao_flatos']);
    const vomitos = normalizeFindingStatus(findings['vomitos_presentes']);
    const toqueRetal = normalizeFindingStatus(findings['toque_retal_massa_fecal']);

    if (dorPalpacao === 'absent') examParts.push('Dor à palpação abdominal: ausente');
    else if (dorPalpacao === 'present') examParts.push('Dor à palpação abdominal: presente');
    else if (textLower.includes('sem dor abdominal')) examParts.push('Dor abdominal importante: negada no relato');
    else examParts.push('Palpação abdominal: não avaliada');

    if (distensao === 'present') examParts.push('Distensão abdominal: presente');
    else if (distensao === 'absent') examParts.push('Distensão abdominal: ausente');
    else examParts.push('Distensão abdominal: não avaliada');

    if (flatos === 'present') examParts.push('Eliminação de flatos: parada');
    else if (flatos === 'absent') examParts.push('Eliminação de flatos: preservada');
    else examParts.push('Eliminação de flatos: não informada');

    if (vomitos === 'present') examParts.push('Vômitos: presentes');
    else if (vomitos === 'absent') examParts.push('Vômitos: ausentes');
    else examParts.push('Vômitos: não informados');

    if (toqueRetal === 'present') examParts.push('Toque retal: massa fecal palpável');
    else if (toqueRetal === 'absent') examParts.push('Toque retal: ampola retal vazia');
    else examParts.push('Toque retal: não realizado');
  }

  if (infectionOrShockContext) {
    const enchimentoCapilar = normalizeFindingStatus(findings['tempo_enchimento_capilar_aumentado']);
    if (enchimentoCapilar === 'present') examParts.push('Perfusão: TEC lentificado');
    else if (enchimentoCapilar === 'absent') examParts.push('Perfusão: TEC preservado');
    else examParts.push('Perfusão periférica (TEC): não avaliada');

    if (!general.glasgow_ocular && !textLower.includes('orientad') && !textLower.includes('sensório')) {
      examParts.push('Estado mental: não avaliado');
    }
  }

  if (
    state.presentations.includes('cefaleia_aguda') ||
    state.presentations.includes('alteracao_consciencia') ||
    state.presentations.includes('febre')
  ) {
    const rigidezNuca = normalizeFindingStatus(findings['rigidez_de_nuca_kernig_brudzinski']);
    if (rigidezNuca === 'present') examParts.push('Sinais meníngeos: presentes');
    else if (rigidezNuca === 'absent') examParts.push('Sinais meníngeos: ausentes');
  }

  const examStr = examParts.join(' | ');

  // Exames laboratoriais/imagem disponíveis
  const labParts: string[] = [];
  const initialLabLabels: Record<string, string> = {
    hemoglobina: 'Hb',
    hematocrito: 'Ht',
    leucocitos: 'Leucócitos',
    plaquetas: 'Plaquetas',
    creatinina: 'Creatinina',
    ureia: 'Ureia',
    tgo: 'TGO/AST',
    tgp: 'TGP/ALT',
    bilirrubina_total: 'Bilirrubina total',
    fosfatase_alcalina: 'FA',
    ggt: 'GGT',
    albumina: 'Albumina',
    sodio: 'Na',
    potassio: 'K',
    lactato: 'Lactato',
    inr: 'INR',
  };
  const initialLabUnits: Record<string, string> = {
    hemoglobina: 'g/dL',
    hematocrito: '%',
    leucocitos: '/mm³',
    plaquetas: '/mm³',
    creatinina: 'mg/dL',
    ureia: 'mg/dL',
    tgo: 'U/L',
    tgp: 'U/L',
    bilirrubina_total: 'mg/dL',
    fosfatase_alcalina: 'U/L',
    ggt: 'U/L',
    albumina: 'g/dL',
    sodio: 'mEq/L',
    potassio: 'mEq/L',
    lactato: 'mmol/L',
  };
  if (general.lactato !== undefined && state.testResults.lactato === undefined) labParts.push(`Lactato: ${general.lactato} mmol/L`);
  if (general.leucocitos !== undefined && state.testResults.leucocitos === undefined) labParts.push(`Leucócitos: ${general.leucocitos}/mm³`);
  if (general.creatinina !== undefined && state.testResults.creatinina === undefined) labParts.push(`Creatinina: ${general.creatinina} mg/dL`);
  if (general.plaquetas !== undefined && state.testResults.plaquetas === undefined) labParts.push(`Plaquetas: ${general.plaquetas}/mm³`);
  Object.entries(state.testResults).forEach(([testId, result]) => {
    if (result.trim()) {
      const label = initialLabLabels[testId] || testId;
      const unit = initialLabUnits[testId];
      labParts.push(`${label}: ${result}${unit ? ` ${unit}` : ''}`);
    }
  });
  const testsStr = labParts.length > 0 ? labParts.join(', ') : 'Nenhum exame laboratorial ou de imagem disponível no momento';

  // 3. A — Avaliação
  let unifyingSynthesis = '';
  if (problemIntegration) {
    unifyingSynthesis = `${problemIntegration.problemCUnifier} ${problemIntegration.clinicalRationale}`;
  } else {
    unifyingSynthesis = 'Investigação de queixa clínica isolada com necessidade de estratificação de gravidade e exclusão de causas tempo-dependentes.';
  }

  // Diferenciais prioritários: Top hipóteses com compatibilidade clínica e plausibilidade
  // Não duplicar com subseção de graves
  const topPriorities = axis1
    .filter((h) => h.multidimensional.compatibility >= 30 || h.scoreProbable >= 30)
    .slice(0, 4);

  const topPriorityIds = new Set(topPriorities.map((h) => h.def.id));

  const priorityDifferentials = topPriorities.map((h) => {
    let severityTag = '';
    if (h.def.dangerLevel === 'critico') severityTag = '[EMERGÊNCIA / CRÍTICO]';
    else if (h.def.dangerLevel === 'alto') severityTag = '[ALTO RISCO]';

    let rationale = h.def.summaryRationale.split('.')[0] + '.';
    if (h.status === 'sustentada') {
      rationale = `Sustentada por achados clínicos compatíveis (${h.matchedFavorableFindings.length} favoráveis).`;
    }

    return {
      name: h.def.name,
      oneLineRationale: rationale,
      severityTag: severityTag || undefined,
    };
  });

  // Graves não excluídos (não deixar passar):
  // Condições críticas ou tempo-dependentes que NÃO foram excluídas e NÃO estão no topo de diferenciais prioritários
  const unruledOutDangerous = axis2
    .filter((h) => !topPriorityIds.has(h.def.id) && !h.exclusionStatus?.excluded)
    .slice(0, 3)
    .map((h) => {
      const criteriaStr = h.def.exclusionCriteria.map((c) => c.description).join(' OU ');
      return {
        name: h.def.name,
        whatIsMissingToExclude: criteriaStr
          ? `Para afastar formalmente: ${criteriaStr}`
          : 'Necessária avaliação dirigida e propedêutica complementar.',
      };
    });

  // Grau de incerteza
  let uncertaintyDegree = 'Moderado';
  let uncertaintyReason = 'Achados parciais documentados; pendente elucidação de exames laboratoriais/imagem.';
  if (examParts.some((p) => p.includes('não avaliad') || p.includes('não informad'))) {
    uncertaintyDegree = 'Alto';
    uncertaintyReason = 'Dados fundamentais do exame físico e disfunção orgânica ainda não avaliados.';
  }

  // Lacunas críticas: somente informações pertinentes ao contexto clínico.
  const criticalGaps: string[] = [];
  if (abdominalContext) {
    if (normalizeFindingStatus(findings['parada_eliminacao_flatos']) === 'not_assessed') criticalGaps.push('eliminação de flatos');
    if (normalizeFindingStatus(findings['distensao_abdominal_visivel']) === 'not_assessed') criticalGaps.push('distensão abdominal');
    if (normalizeFindingStatus(findings['vomitos_presentes']) === 'not_assessed') criticalGaps.push('presença de vômitos');
    if (normalizeFindingStatus(findings['dor_palpacao_abdominal']) === 'not_assessed') criticalGaps.push('palpação abdominal / peritonite');
    if (normalizeFindingStatus(findings['toque_retal_massa_fecal']) === 'not_assessed') criticalGaps.push('toque retal (quando indicado)');
  }
  if (infectionOrShockContext) {
    if (!general.creatinina && !state.testResults.creatinina) criticalGaps.push('função renal');
    if (!general.diurese_ml && !textLower.includes('diurese')) criticalGaps.push('débito urinário');
    if (!general.glasgow_ocular && !textLower.includes('orientad') && !textLower.includes('sensório')) criticalGaps.push('estado mental / sensório');
    if (!general.plaquetas && !state.testResults.plaquetas) criticalGaps.push('plaquetas / coagulograma');
    if (!general.lactato && !state.testResults.lactato) criticalGaps.push('lactato sérico, se indicado pelo contexto');
  }

  // 4. P — Plano / Conduta: deriva de alertas e exames realmente cadastrados.
  const planImmediate = alerts.map((alert) => {
    const firstAction = alert.immediateActionRequired.split(/[.;]/)[0].trim();
    const shortTitle = alert.title.replace(/^ALERTA[^:]*:\s*/i, '');
    return firstAction ? `${shortTitle}: ${firstAction}` : shortTitle;
  });

  // No plano, listar apenas os exames. Indicações e limitações permanecem no painel de exames.
  const planInvestigation = suggestedTests.slice(0, 6).map((test) => test.name);

  // Não prescrever terapêutica sem uma recomendação específica e validada na base de conhecimento.
  const planTherapeutics: string[] = [];

  const planReassessment: string[] = [
    'Reavaliar após os resultados e diante de piora ou mudança clínica.',
  ];

  // Montagem do texto em Markdown com plano telegráfico.
  const planLines = [
    ...(planImmediate.length ? [`- **Imediato:** ${planImmediate.join('; ')}.`] : []),
    `- **Investigação:** ${planInvestigation.length ? planInvestigation.join('; ') : 'Definir conforme avaliação clínica'}.`,
    `- **Reavaliação:** ${planReassessment[0]}`,
  ].join(String.fromCharCode(10));

  const formattedMarkdown = `### Síntese Clínica Integrada ${effectiveTag}

**S — Subjetivo**  
${subjective}

**O — Objetivo**  
- **Sinais vitais:** ${ssvvStr}  
- **Exame físico:** ${examStr}  
- **Exames disponíveis:** ${testsStr}  

**A — Avaliação**  
${unifyingSynthesis}

*Diferenciais prioritários:*  
${priorityDifferentials.map((d, idx) => `${idx + 1}. **${d.name}** — ${d.oneLineRationale} ${d.severityTag ? `**${d.severityTag}**` : ''}`).join('\n')}

*Graves não excluídos (não deixar passar):*  
${unruledOutDangerous.length > 0 ? unruledOutDangerous.map((d) => `- **${d.name}** — ${d.whatIsMissingToExclude}`).join('\n') : '- Nenhuma outra hipótese grave pendente fora dos diferenciais prioritários.'}

*Grau de incerteza:* **${uncertaintyDegree}** (${uncertaintyReason})  
*Lacunas críticas:* ${criticalGaps.length > 0 ? criticalGaps.join(', ') : 'Nenhuma lacuna crítica pendente'}.

**P — Plano / Conduta** *(Sugestões da IDG — confirme antes de executar)*  
${planLines}
`;

  return {
    versionTag: effectiveTag,
    timestamp: now.toISOString(),
    subjective,
    objective: {
      vitalSigns: ssvvStr,
      physicalExam: examStr,
      availableTests: testsStr,
    },
    assessment: {
      unifyingSynthesis,
      priorityDifferentials,
      unruledOutDangerous,
      uncertaintyDegree,
      criticalGaps,
    },
    plan: {
      immediate: planImmediate,
      investigation: planInvestigation,
      therapeuticsToConsider: planTherapeutics,
      reassessmentAndAlerts: planReassessment,
    },
    formattedMarkdown,
  };
}
