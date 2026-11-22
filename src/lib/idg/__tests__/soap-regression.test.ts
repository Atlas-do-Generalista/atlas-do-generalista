import { describe, it, expect } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — Cenário de Regressão e Síntese SOAP Integrada (Seção 4)', () => {
  it('atende integralmente a todos os critérios do checklist de aprovação', () => {
    // 1. Inicializa com o cenário de validação:
    // "Homem adulto (idade a confirmar), febre 39 °C (1d), taquicardia, PAS ~170 mmHg, FR e SpO₂ preservadas, 14 dias sem evacuar, sem dor abdominal importante."
    const store = new InMemoryIDGStore();
    store.initializeCase({
      presentations: ['febre', 'obstipacao'],
      freeTextDescription:
        'Homem adulto (idade a confirmar), febre 39 °C (1d), taquicardia, PAS ~170 mmHg, FR e SpO₂ preservadas, 14 dias sem evacuar, sem dor abdominal importante.',
      findings: {
        febre_sindrome_febril: 'present',
        taquicardia_fc_maior_100: 'present',
        obstipacao_prolongada_dias: 'present',
        dor_palpacao_abdominal: 'absent', // "sem dor abdominal importante"
      },
    });

    const evaluation = store.getEvaluation();
    const soap = evaluation.soap;
    const md = soap.formattedMarkdown;

    // Critério 1: Saída única estruturada em SOAP, concisa, sem frases prolixas padronizadas
    expect(md).toContain('**S — Subjetivo**');
    expect(md).toContain('**O — Objetivo**');
    expect(md).toContain('**A — Avaliação**');
    expect(md).toContain('**P — Plano / Conduta**');
    expect(soap.versionTag).toBe('[Inicial]');
    // Estilo telegráfico: sem locuções longas como "Não há registro de..."
    expect(md).not.toContain('Não há registro de');
    expect(md).not.toContain('Não existem dados suficientes para');

    // Critério 2: Integra febre + obstipação 14d (Problema C), gerando fecaloma, obstrução, colite estercoral e sepse
    expect(evaluation.problemIntegration).toBeDefined();
    expect(evaluation.problemIntegration?.problemA).toContain('Síndrome febril');
    expect(evaluation.problemIntegration?.problemB).toContain('Obstipação grave prolongada');
    expect(evaluation.problemIntegration?.problemCUnifier).toContain('Problema C (Etiologia Unificadora)');

    const topDiffNames = soap.assessment.priorityDifferentials.map((d) => d.name.toLowerCase());
    const allAxis1Names = evaluation.axis1Probable.map((h) => h.def.name.toLowerCase());
    const allAxis2Names = evaluation.axis2Critical.map((h) => h.def.name.toLowerCase());

    // Deve contemplar fecaloma, colite estercoral, obstrução intestinal e sepse
    const combinedHypotheses = [...topDiffNames, ...allAxis1Names, ...allAxis2Names].join(' ');
    expect(combinedHypotheses).toContain('fecaloma');
    expect(combinedHypotheses).toContain('colite estercoral');
    expect(combinedHypotheses).toContain('obstrução intestinal');
    expect(combinedHypotheses).toContain('sepse');

    // Critério 3: Não descarta sepse por PAS 170 mmHg ou falta de lactato; não confirma sepse sem disfunção documentada
    const sepseHypo = evaluation.axis2Critical.find((h) => h.def.id === 'sepse_choque_septico');
    expect(sepseHypo).toBeDefined();
    // Não pode estar excluída (a hipertensão ou ausência de hipotensão não descarta sepse inicial)
    expect(sepseHypo?.exclusionStatus?.excluded).toBeFalsy();
    // Nem pode estar confirmada (pois não há disfunção orgânica documentada)
    expect(sepseHypo?.status).not.toBe('confirmada');

    // Critério 4: Lista lacunas críticas sem convertê-las em achados negativos
    const gaps = soap.assessment.criticalGaps;
    expect(gaps).toContain('eliminação de flatos');
    expect(gaps).toContain('distensão abdominal');
    expect(gaps).toContain('presença de vômitos');
    expect(gaps).toContain('toque retal (fecaloma)');
    expect(gaps).toContain('função renal');
    expect(gaps).toContain('débito urinário');
    expect(gaps).toContain('estado mental / sensório');

    // No exame físico objetivo, dados ausentes aparecem como "não avaliada" / "não informada", NUNCA como ausente/negativo
    expect(soap.objective.physicalExam).toContain('Distensão abdominal: não avaliada');
    expect(soap.objective.physicalExam).toContain('Eliminação de flatos: não informada');
    expect(soap.objective.physicalExam).toContain('Vômitos: não informados');
    expect(soap.objective.physicalExam).toContain('Toque retal: não realizado');

    // Critério 5: Não polui o topo com hipóteses desconexas (ex.: meningite, anafilaxia)
    // As hipóteses prioritárias do topo NÃO devem ser meningite nem anafilaxia
    const top2Ids = evaluation.axis1Probable.slice(0, 2).map((h) => h.def.id);
    expect(top2Ids).not.toContain('meningite_bacteriana_aguda');
    expect(top2Ids).not.toContain('anafilaxia_mimetizador_sepse');
    expect(top2Ids).not.toContain('fasciite_necrotizante');

    // Critério 7: Novas interações atualizam a mesma ficha SOAP distinguindo dado inicial, atualizado e reavaliação
    // Simula reavaliação: médico realiza toque retal e encontra fecaloma volumoso às 17:30
    store.setFinding('toque_retal_massa_fecal', 'present');
    const evalAtualizado = store.getEvaluation();
    expect(evalAtualizado.soap.versionTag).toBe('[Atualizado]');
    expect(evalAtualizado.soap.objective.physicalExam).toContain('Toque retal: massa fecal endurecida (fecaloma)');

    // Simula registro de exame complementar
    store.setTestResult('tc_abdomen', 'Fecaloma impactado em sigmoide sem perfuração livre');
    const evalResultado = store.getEvaluation();
    expect(evalResultado.soap.versionTag).toBe('[Resultado]');
    expect(evalResultado.soap.objective.availableTests).toContain('Fecaloma impactado em sigmoide');

    // Reavaliação explícita
    const evalReavaliacao = store.recordReassessment('18:00');
    expect(evalReavaliacao.soap.versionTag).toBe('[Reavaliação - 18:00]');
  });
});
