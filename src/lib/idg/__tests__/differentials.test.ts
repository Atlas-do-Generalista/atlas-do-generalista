import { describe, it, expect } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — Geração e Atualização de Diagnósticos Diferenciais', () => {
  it('usa o texto livre para ativar hipóteses quando contém apresentações reconhecidas', () => {
    const store = new InMemoryIDGStore();
    store.setFreeTextDescription('Paciente com febre alta e 14 dias sem evacuar.');

    const evaluation = store.getEvaluation();
    expect(evaluation.problemIntegration).toBeDefined();
    expect(evaluation.axis1Probable.some((h) => h.def.id === 'fecaloma_impactacao_fecal')).toBe(true);
    expect(evaluation.axis2Critical.some((h) => h.def.id === 'colite_estercoral')).toBe(true);
  });

  it('incorpora hipóteses manuais quando há correspondência na base de conhecimento', () => {
    const store = new InMemoryIDGStore(['febre']);
    store.setUserInitialHypotheses(['Fecaloma / Impactação Fecal Grave']);

    const evaluation = store.getEvaluation();
    expect(evaluation.axis1Probable.some((h) => h.def.id === 'fecaloma_impactacao_fecal')).toBe(true);
  });

  it('gera hipóteses automaticamente a partir da apresentação sem depender de hipótese do médico', () => {
    // Médico abre tela apenas com "Dor torácica", sem sugerir nenhuma doença
    const store = new InMemoryIDGStore(['dor_toracica']);
    const evalState = store.getEvaluation();

    // Deve conter automaticamente SCA, Dissecção de Aorta, TEP, Pneumotórax, etc.
    const hypIds = evalState.axis1Probable.map((h) => h.def.id);
    expect(hypIds).toContain('sca');
    expect(hypIds).toContain('disseccao_aorta');
    expect(hypIds).toContain('tep');
    expect(hypIds).toContain('pneumotorax_hipertensivo');
  });

  it('identifica hipóteses perigosas não consideradas pelo médico (Cognitive Forcing)', () => {
    const store = new InMemoryIDGStore(['dor_toracica']);

    // O médico declara que está pensando apenas em "infarto" ou "SCA"
    store.setUserInitialHypotheses(['SCA', 'infarto']);

    const evalState = store.getEvaluation();

    // Dissecção de aorta e TEP devem aparecer na lista de unconsideredDangerous
    const unconsideredIds = evalState.unconsideredDangerous.map((h) => h.def.id);
    expect(unconsideredIds).toContain('disseccao_aorta');
    expect(unconsideredIds).toContain('tep');
    expect(unconsideredIds).toContain('pneumotorax_hipertensivo');

    // SCA não deve ser considerada "esquecida" pois o médico a citou
    expect(unconsideredIds).not.toContain('sca');
  });

  it('atualiza continuamente as prioridades e suporte das hipóteses conforme achados são adicionados', () => {
    const store = new InMemoryIDGStore(['dor_toracica']);

    // Paciente relata dor que piora ao deitar e melhora ao sentar para frente + atrito pericárdico
    store.setFinding('dor_piora_decubito_alivia_frente', 'presente');
    store.setFinding('atrito_pericardico_ausculta', 'presente');

    const evalState = store.getEvaluation();

    // Pericardite deve ascender ao topo do Eixo 1 como sustentada
    const topEixo1 = evalState.axis1Probable[0];
    expect(topEixo1.def.id).toBe('pericardite_aguda');
    expect(topEixo1.status).toBe('sustentada');

    // Mas no Eixo 2, SCA e Dissecção continuam listadas como condições a não deixar passar
    expect(evalState.axis2Critical.some((h) => h.def.id === 'disseccao_aorta')).toBe(true);
    expect(evalState.axis2Critical.some((h) => h.def.id === 'sca')).toBe(true);
  });
});
