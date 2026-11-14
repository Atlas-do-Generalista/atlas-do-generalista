import type { ContextoPaciente, ResultadoCalculadora, Calculadora } from '../calc-engine/types';
import type { ClinicalSummaryOutput, ParagrafoClinico } from './types';

export interface ItemCalculado {
  calc: Calculadora;
  resultado: ResultadoCalculadora;
}

function fmtNum(val: unknown, decimals = 1): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return '—';
  return Number.isInteger(val) && decimals === 0
    ? String(val)
    : val.toFixed(decimals).replace('.', ',');
}

function escapeOrEmpty(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'não informado';
  return String(val);
}

/**
 * Compõe o Resumo Clínico Estruturado para prontuário a partir dos dados e resultados calculados.
 */
export function composeClinicalSummary(
  dados: ContextoPaciente,
  resultados: ItemCalculado[],
): ClinicalSummaryOutput {
  const mapRes = new Map<string, ResultadoCalculadora>();
  for (const item of resultados) {
    mapRes.set(item.calc.id, item.resultado);
  }

  const paragrafos: ParagrafoClinico[] = [];

  // 1. Demografia e Antropometria
  const partesDemo: string[] = [];
  if (dados.idade !== null && dados.idade !== undefined) partesDemo.push(`${dados.idade} anos`);
  if (dados.sexo) partesDemo.push(dados.sexo === 'feminino' ? 'sexo feminino' : dados.sexo === 'masculino' ? 'sexo masculino' : dados.sexo);
  if (dados.peso) partesDemo.push(`peso ${fmtNum(dados.peso, 1)} kg`);
  if (dados.altura) partesDemo.push(`altura ${fmtNum(dados.altura, 0)} cm`);

  const imcRes = mapRes.get('imc');
  if (imcRes) partesDemo.push(`IMC ${fmtNum(imcRes.valor, 1)} kg/m² (${imcRes.resumo ?? ''})`);

  const pbwRes = mapRes.get('peso-predito');
  if (pbwRes) partesDemo.push(`Peso predito (ARDSNet): ${fmtNum(pbwRes.valor, 1)} kg`);

  if (dados.tipo_admissao) {
    const adm = dados.tipo_admissao === 'clinica'
      ? 'admissão clínica'
      : dados.tipo_admissao === 'pos_operatorio_eletivo'
        ? 'pós-operatório eletivo'
        : 'pós-operatório não eletivo/urgência';
    partesDemo.push(adm);
  }

  if (dados.insuficiencia_organica_grave_imunossupressao !== undefined && dados.insuficiencia_organica_grave_imunossupressao !== null) {
    partesDemo.push(dados.insuficiencia_organica_grave_imunossupressao ? 'com imunossupressão/doença crônica grave prévia' : 'sem imunossupressão grave prévia');
  }

  if (partesDemo.length > 0) {
    paragrafos.push({
      categoria: 'demografia',
      titulo: 'Identificação e Antropometria',
      conteudo: `Paciente ${partesDemo.join(', ')}.`,
    });
  }

  // 2. Sinais Vitais e Hemodinâmica
  const partesSsvv: string[] = [];
  if (dados.pas !== undefined && dados.pad !== undefined) {
    partesSsvv.push(`PA ${dados.pas}x${dados.pad} mmHg`);
  } else if (dados.pas !== undefined) {
    partesSsvv.push(`PAS ${dados.pas} mmHg`);
  }

  const pamRes = mapRes.get('pam');
  if (pamRes) partesSsvv.push(`PAM ${fmtNum(pamRes.valor, 0)} mmHg`);

  const ppRes = mapRes.get('pressao-pulso');
  if (ppRes) partesSsvv.push(`Pressão de pulso ${fmtNum(ppRes.valor, 0)} mmHg`);

  if (dados.fc !== undefined) partesSsvv.push(`FC ${dados.fc} bpm`);
  if (dados.fr !== undefined) partesSsvv.push(`FR ${dados.fr} irpm`);
  if (dados.temperatura !== undefined) partesSsvv.push(`Temp ${fmtNum(dados.temperatura, 1)} °C`);

  const siRes = mapRes.get('shock-index');
  if (siRes) partesSsvv.push(`Índice de Choque ${fmtNum(siRes.valor, 2)} (${siRes.resumo ?? ''})`);

  if (dados.spo2 !== undefined) {
    const o2Text = dados.o2_suplementar ? 'em suporte de O₂ suplementar' : 'em ar ambiente';
    partesSsvv.push(`SpO₂ ${dados.spo2}% (${o2Text})`);
  }

  if (dados.vasoativos_em_uso !== undefined && dados.vasoativos_em_uso !== null) {
    partesSsvv.push(dados.vasoativos_em_uso ? 'sob infusão contínua de drogas vasoativas' : 'sem drogas vasoativas');
  }

  if (partesSsvv.length > 0) {
    paragrafos.push({
      categoria: 'ssvv',
      titulo: 'Sinais Vitais e Hemodinâmica',
      conteudo: partesSsvv.join(', ') + '.',
    });
  }

  // 3. Neurológico
  const partesNeuro: string[] = [];
  if (dados.gcs !== undefined && dados.gcs !== null) {
    let gcsDesc = `GCS ${dados.gcs}`;
    if (dados.glasgow_ocular || dados.glasgow_verbal || dados.glasgow_motor) {
      gcsDesc += ` (O${dados.glasgow_ocular ?? '—'} V${dados.glasgow_verbal ?? '—'} M${dados.glasgow_motor ?? '—'})`;
    }
    partesNeuro.push(gcsDesc);
  }
  if (dados.consciencia) {
    const cMap: Record<string, string> = {
      alerta: 'estado de alerta preservado',
      confusao: 'confusão mental aguda',
      rebaixamento: 'rebaixamento do nível de consciência',
    };
    partesNeuro.push(cMap[dados.consciencia] ?? dados.consciencia);
  }
  if (dados.glasgow_avaliacao_limitada) {
    partesNeuro.push(`avaliação limitada por sedação/intubação (GCS pré-sedação: ${dados.glasgow_pre_sedacao ?? 'não informado'})`);
  }

  if (partesNeuro.length > 0) {
    paragrafos.push({
      categoria: 'neurologico',
      titulo: 'Avaliação Neurológica',
      conteudo: partesNeuro.join(', ') + '.',
    });
  }

  // 4. Gasometria e Troca Gasosa
  const gasoRes = mapRes.get('analise-gasometria');
  const partesGaso: string[] = [];
  if (dados.ph !== undefined) partesGaso.push(`pH ${fmtNum(dados.ph, 2)}`);
  if (dados.paco2 !== undefined) partesGaso.push(`PaCO₂ ${fmtNum(dados.paco2, 1)} mmHg`);
  if (dados.pao2 !== undefined) partesGaso.push(`PaO₂ ${fmtNum(dados.pao2, 1)} mmHg`);
  if (dados.hco3 !== undefined) partesGaso.push(`HCO₃⁻ ${fmtNum(dados.hco3, 1)} mEq/L`);
  if (dados.lactato !== undefined) partesGaso.push(`Lactato ${fmtNum(dados.lactato, 1)} mmol/L`);

  if (gasoRes) {
    partesGaso.push(`Diagnóstico: ${gasoRes.resumo}`);
  }

  if (partesGaso.length > 0) {
    paragrafos.push({
      categoria: 'gasometria',
      titulo: 'Gasometria e Troca Gasosa',
      conteudo: partesGaso.join(', ') + '.',
    });
  }

  // 5. Função Renal e Hidroeletrolítico
  const partesRenal: string[] = [];
  if (dados.creatinina !== undefined) partesRenal.push(`Creatinina ${fmtNum(dados.creatinina, 2)} mg/dL`);
  if (dados.ureia !== undefined) partesRenal.push(`Ureia ${fmtNum(dados.ureia, 1)} mg/dL`);

  const ckdRes = mapRes.get('ckd-epi-2021');
  if (ckdRes) partesRenal.push(`TFGe CKD-EPI: ${fmtNum(ckdRes.valor, 0)} mL/min/1,73m² (${ckdRes.resumo ?? ''})`);

  const cgRes = mapRes.get('cockcroft-gault');
  if (cgRes) partesRenal.push(`ClCr Cockcroft-Gault: ${fmtNum(cgRes.valor, 1)} mL/min`);

  const fenaRes = mapRes.get('fena');
  if (fenaRes) partesRenal.push(`FeNa: ${fmtNum(fenaRes.valor, 2)}% (${fenaRes.resumo ?? ''})`);

  const feUrRes = mapRes.get('fe-ureia');
  if (feUrRes) partesRenal.push(`FeUreia: ${fmtNum(feUrRes.valor, 1)}% (${feUrRes.resumo ?? ''})`);

  if (dados.sodio !== undefined) partesRenal.push(`Na⁺ ${fmtNum(dados.sodio, 0)} mEq/L`);
  if (dados.potassio !== undefined) partesRenal.push(`K⁺ ${fmtNum(dados.potassio, 1)} mEq/L`);
  if (dados.cloro !== undefined) partesRenal.push(`Cl⁻ ${fmtNum(dados.cloro, 0)} mEq/L`);

  const caCorr = mapRes.get('calcio-corrigido');
  if (caCorr) partesRenal.push(`Cálcio corrigido: ${fmtNum(caCorr.valor, 1)} mg/dL`);

  const defAgua = mapRes.get('deficit-agua-livre');
  if (defAgua && defAgua.valor > 0) partesRenal.push(`Déficit água livre: ${fmtNum(defAgua.valor, 1)} L`);

  if (dados.diurese_ml !== undefined && dados.diurese_horas !== undefined) {
    partesRenal.push(`Diurese: ${dados.diurese_ml} mL em ${dados.diurese_horas} horas`);
  }
  if (dados.ira_atual !== undefined && dados.ira_atual !== null) {
    partesRenal.push(dados.ira_atual ? 'Insuficiência renal aguda documentada' : 'Sem IRA recente');
  }
  if (dados.terapia_renal_substitutiva) {
    partesRenal.push('Em terapia renal substitutiva / hemodiálise');
  }

  if (partesRenal.length > 0) {
    paragrafos.push({
      categoria: 'renal',
      titulo: 'Função Renal e Eletrólitos',
      conteudo: partesRenal.join(', ') + '.',
    });
  }

  // 6. Função Hepática e Hematologia
  const partesHep: string[] = [];
  if (dados.bilirrubina !== undefined) partesHep.push(`Bilirrubina total ${fmtNum(dados.bilirrubina, 1)} mg/dL`);
  if (dados.albumina !== undefined) partesHep.push(`Albumina ${fmtNum(dados.albumina, 1)} g/dL`);
  if (dados.inr !== undefined) partesHep.push(`INR ${fmtNum(dados.inr, 2)}`);
  if (dados.plaquetas !== undefined) partesHep.push(`Plaquetas ${fmtNum(dados.plaquetas, 0)}/µL`);
  if (dados.leucocitos !== undefined) partesHep.push(`Leucócitos ${fmtNum(dados.leucocitos, 1)}/µL`);
  if (dados.hemoglobina !== undefined) partesHep.push(`Hemoglobina ${fmtNum(dados.hemoglobina, 1)} g/dL`);
  if (dados.hematocrito !== undefined) partesHep.push(`Hematócrito ${fmtNum(dados.hematocrito, 1)}%`);

  const cpRes = mapRes.get('child-pugh');
  if (cpRes) partesHep.push(`Child-Pugh: ${cpRes.valor} pontos (${cpRes.resumo ?? ''})`);

  const meldRes = mapRes.get('meld-3');
  if (meldRes) partesHep.push(`MELD 3.0: ${fmtNum(meldRes.valor, 0)} pontos`);

  const albiRes = mapRes.get('albi');
  if (albiRes) partesHep.push(`ALBI: ${fmtNum(albiRes.valor, 2)} (${albiRes.resumo ?? ''})`);

  if (partesHep.length > 0) {
    paragrafos.push({
      categoria: 'hepatico',
      titulo: 'Função Hepática e Hematologia',
      conteudo: partesHep.join(', ') + '.',
    });
  }

  // 7. Escores de Gravidade e Risco
  const partesScores: string[] = [];
  const news2Res = mapRes.get('news2');
  if (news2Res) partesScores.push(`NEWS2: ${news2Res.valor} ponto(s) — ${news2Res.resumo ?? ''}`);

  const qsofaRes = mapRes.get('qsofa');
  if (qsofaRes) partesScores.push(`qSOFA: ${qsofaRes.valor} ponto(s) — ${qsofaRes.resumo ?? ''}`);

  const sofaRes = mapRes.get('sofa-2');
  if (sofaRes) partesScores.push(`SOFA-2: ${sofaRes.valor} ponto(s) — ${sofaRes.resumo ?? ''}`);

  const apacheRes = mapRes.get('apache-ii');
  if (apacheRes) partesScores.push(`APACHE II: ${apacheRes.valor} pontos — ${apacheRes.resumo ?? ''}`);

  const rcriRes = mapRes.get('rcri');
  if (rcriRes) partesScores.push(`RCRI: ${rcriRes.valor} preditor(es) (${rcriRes.resumo ?? ''})`);

  const paduaRes = mapRes.get('padua');
  if (paduaRes) partesScores.push(`Escore de Pádua: ${paduaRes.valor} ponto(s) (${paduaRes.resumo ?? ''})`);

  if (partesScores.length > 0) {
    paragrafos.push({
      categoria: 'scores',
      titulo: 'Escores de Gravidade e Risco',
      conteudo: partesScores.join('; ') + '.',
    });
  }

  // Linha concisa de tokens de scores
  const scoreTokens: string[] = [];
  if (news2Res) scoreTokens.push(`NEWS2 ${news2Res.valor}`);
  if (qsofaRes) scoreTokens.push(`qSOFA ${qsofaRes.valor}`);
  if (sofaRes) scoreTokens.push(`SOFA-2 ${sofaRes.valor}`);
  if (apacheRes) scoreTokens.push(`APACHE II ${apacheRes.valor}`);
  if (pamRes) scoreTokens.push(`PAM ${fmtNum(pamRes.valor, 0)}`);
  if (siRes) scoreTokens.push(`IC ${fmtNum(siRes.valor, 2)}`);
  if (ckdRes) scoreTokens.push(`TFGe ${fmtNum(ckdRes.valor, 0)}`);
  if (cpRes) scoreTokens.push(`CTP ${cpRes.valor}`);
  if (meldRes) scoreTokens.push(`MELD ${fmtNum(meldRes.valor, 0)}`);
  if (gasoRes) scoreTokens.push(`pH ${fmtNum(gasoRes.valor, 2)}`);

  const linhaResumoScores = scoreTokens.join(' | ');

  const textoEvolucaoCorrida = paragrafos
    .map((p) => `[${p.titulo.toUpperCase()}]\n${p.conteudo}`)
    .join('\n\n');

  return {
    linhaResumoScores,
    paragrafos,
    textoEvolucaoCorrida,
    geradoEm: new Date().toISOString(),
  };
}
