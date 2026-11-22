import { describe, expect, it } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — filtro de hipóteses por sexo informado', () => {
  it('não sugere gravidez ectópica para paciente descrito como masculino', () => {
    const store = new InMemoryIDGStore(['dor_abdominal']);
    store.setFreeTextDescription('Paciente do sexo masculino, 55 anos, com dor abdominal.');
    store.setFinding('sangramento_vaginal_com_dor_pelvica', 'presente');
    store.setFinding('beta_hcg_positivo', 'presente');

    const evaluation = store.getEvaluation();
    const activeHypotheses = [...evaluation.axis1Probable, ...evaluation.axis2Critical];

    expect(activeHypotheses.some((hypothesis) => hypothesis.def.id === 'gravidez_ectopica_rota')).toBe(false);
    expect(evaluation.suggestedTests.some((test) => test.id === 'beta_hcg_quantitativo')).toBe(false);
    expect(evaluation.suggestedQuestions.some((question) => question.targetFindingId === 'sangramento_vaginal_com_dor_pelvica')).toBe(false);
    expect(evaluation.activeSafetyAlerts.some((alert) => alert.relatedHypothesisId === 'gravidez_ectopica_rota')).toBe(false);
    expect(evaluation.soap.subjective).toContain('55 anos, sexo masculino');
  });

  it('mantém gravidez ectópica no diferencial quando o sexo feminino está informado', () => {
    const store = new InMemoryIDGStore(['dor_abdominal']);
    store.setPatientDemographics({ sexo: 'feminino' });
    store.setFinding('sangramento_vaginal_com_dor_pelvica', 'presente');

    const evaluation = store.getEvaluation();

    expect(
      [...evaluation.axis1Probable, ...evaluation.axis2Critical]
        .some((hypothesis) => hypothesis.def.id === 'gravidez_ectopica_rota'),
    ).toBe(true);
    expect(evaluation.activeSafetyAlerts.some((alert) => alert.relatedHypothesisId === 'gravidez_ectopica_rota')).toBe(true);
  });

  it('não exclui hipóteses relacionadas à gestação quando o sexo não foi informado', () => {
    const store = new InMemoryIDGStore(['dor_abdominal']);
    const evaluation = store.getEvaluation();

    expect(
      [...evaluation.axis1Probable, ...evaluation.axis2Critical]
        .some((hypothesis) => hypothesis.def.id === 'gravidez_ectopica_rota'),
    ).toBe(true);
  });
});
