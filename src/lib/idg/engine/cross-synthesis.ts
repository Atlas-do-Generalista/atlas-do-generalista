import type { IDGState, ProblemGroupIntegration } from '../types';

/**
 * Módulo de Agrupamento de Problemas e Etiologia Unificadora (Cross-Synthesis)
 *
 * Conecta queixas e achados aparentemente isolados em uma síntese integradora:
 * Problema A (ex.: Síndrome febril / taquicardia) + Problema B (ex.: Obstipação prolongada 14d)
 * -> Problema C (Etiologia Unificadora: Foco abdominal secundário a complicação de obstipação).
 */
export function analyzeProblemGroups(state: IDGState): ProblemGroupIntegration | undefined {
  const pSet = new Set(state.presentations);
  const textLower = (state.freeTextDescription || '').toLowerCase();
  const findings = state.findings;

  // Detecção de Síndrome Febril / Inflamatória (Problema A)
  const hasFebrileSyndrome =
    pSet.has('febre') ||
    textLower.includes('febre') ||
    textLower.includes('39') ||
    textLower.includes('calafrio') ||
    findings['febre_sindrome_febril'] === 'present' ||
    findings['febre_sindrome_febril'] === 'presente';

  // Detecção de Obstipação Prolongada / Retenção de Fezes (Problema B)
  const hasObstipation =
    pSet.has('obstipacao') ||
    textLower.includes('evacuar') ||
    textLower.includes('obstipa') ||
    textLower.includes('constipa') ||
    textLower.includes('14 dias') ||
    textLower.includes('fecaloma') ||
    findings['obstipacao_prolongada_dias'] === 'present' ||
    findings['obstipacao_prolongada_dias'] === 'presente';

  // Integração Febre + Obstipação (Cenário de Regressão e Síndrome Compartilhada)
  if (hasFebrileSyndrome && hasObstipation) {
    const daysMatch = textLower.match(/(\d+)\s*dias?\s*sem\s*evacuar/);
    const daysStr = daysMatch ? `${daysMatch[1]} dias` : '14 dias';

    return {
      problemA: 'Problema A: Síndrome febril aguda e taquicardia (resposta inflamatória sistêmica / SIRS)',
      problemB: `Problema B: Obstipação grave prolongada (${daysStr} sem evacuar / estase colônica extrema)`,
      problemCUnifier:
        'Problema C (Etiologia Unificadora): Complicação intra-abdominal decorrente de fecaloma/impactação fecal prolongada com estase e translocação bacteriana, evoluindo com colite estercoral, perfuração iminente/bloqueada, obstrução intestinal mecânica ou sepse de foco abdominal.',
      sharedHypotheses: [
        'fecaloma_impactacao_fecal',
        'colite_estercoral',
        'obstrucao_intestinal_estrangulada',
        'sepse_choque_septico',
        'perfuracao_viscera_oca',
        'pseudo_obstrucao_colonica_ogilvie',
        'neoplasia_colorretal_obstrutiva',
      ],
      clinicalRationale:
        'A obstipação prolongada de 14 dias predispõe à impactação de fezes endurecidas com isquemia de pressão na parede colônica (colite estercoral), translocação bacteriana e sepse secundária, mesmo na ausência inicial de peritonite exuberante.',
    };
  }

  // Integração Dor Torácica + Síncope
  if (pSet.has('dor_toracica') && pSet.has('sincope')) {
    return {
      problemA: 'Problema A: Dor torácica aguda',
      problemB: 'Problema B: Síncope / Colapso circulatório transitório',
      problemCUnifier:
        'Problema C: Emergência cardiovascular com obstrução de via de saída, dissecção aórtica com tamponamento/hipoperfusão cerebral ou arritmia grave por isquemia miocárdica.',
      sharedHypotheses: ['disseccao_aorta', 'tep', 'tamponamento_cardiaco', 'sca'],
      clinicalRationale:
        'A ocorrência de síncope associada a dor torácica eleva drasticamente a probabilidade de dissecção de aorta tipo A ou TEP maciço.',
    };
  }

  // Integração Febre + Dor Vertebral
  if (pSet.has('febre') && pSet.has('dor_vertebral')) {
    return {
      problemA: 'Problema A: Síndrome febril',
      problemB: 'Problema B: Dor vertebral localizada',
      problemCUnifier:
        'Problema C: Infecção espinhal (espondilodiscite ou abscesso epidural espinhal com risco de compressão medular).',
      sharedHypotheses: ['abscesso_epidural_espinhal', 'compressao_medular_metastatica'],
      clinicalRationale:
        'Febre associada à dor vertebral deve ser tratada como abscesso epidural até elucidação definitiva por ressonância.',
    };
  }

  return undefined;
}
