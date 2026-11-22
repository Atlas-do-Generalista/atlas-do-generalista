import { describe, expect, it } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — exames iniciais e plano SOAP conciso', () => {
  it('inclui resultados laboratoriais preenchidos na síntese SOAP', () => {
    const store = new InMemoryIDGStore(['febre', 'obstipacao']);
    store.setTestResult('hemoglobina', '13,4');
    store.setTestResult('leucocitos', '14.200');
    store.setTestResult('plaquetas', '210.000');
    store.setTestResult('creatinina', '1,2');
    store.setTestResult('tgo', '30');
    store.setTestResult('tgp', '28');

    const soap = store.getEvaluation().soap;

    expect(soap.objective.availableTests).toContain('Hb: 13,4');
    expect(soap.objective.availableTests).toContain('Leucócitos: 14.200');
    expect(soap.objective.availableTests).toContain('Plaquetas: 210.000');
    expect(soap.objective.availableTests).toContain('Creatinina: 1,2');
    expect(soap.objective.availableTests).toContain('TGO/AST: 30');
    expect(soap.objective.availableTests).toContain('TGP/ALT: 28');
    expect(soap.assessment.criticalGaps).not.toContain('função renal');
    expect(soap.assessment.criticalGaps).not.toContain('plaquetas / coagulograma');
  });

  it('mantém investigação no SOAP como lista curta de exames, sem repetir limitações', () => {
    const store = new InMemoryIDGStore(['febre', 'obstipacao']);
    const soap = store.getEvaluation().soap;
    const planSection = soap.formattedMarkdown.split('**P — Plano / Conduta**')[1] || '';

    expect(planSection).toContain('**Investigação:**');
    expect(planSection).not.toContain('Limitações:');
    expect(planSection).not.toContain('Risco de falso negativo');
    expect(planSection).not.toContain('**Imediato:** .');
    expect(planSection).not.toContain('Investiga: fecaloma_');
  });
});
