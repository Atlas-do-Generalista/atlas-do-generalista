import { describe, it, expect } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — Princípios de Segurança Clínica e Motor de Alertas', () => {
  it('garante que ausência de informação NUNCA equivale a resultado negativo', () => {
    const store = new InMemoryIDGStore(['dor_toracica']);
    const evalBefore = store.getEvaluation();

    // Na inicialização, sem nenhum achado preenchido
    const disseccao = evalBefore.axis2Critical.find((h) => h.def.id === 'disseccao_aorta');
    expect(disseccao).toBeDefined();
    // A hipótese não pode ser considerada excluída por falta de dados
    expect(disseccao?.exclusionStatus?.excluded).toBeFalsy();
    expect(disseccao?.status).toBe('nao_avaliada');

    // Registra como 'desconhecido'
    store.setFinding('dor_lancinante_rasgando_dorso', 'desconhecido');
    const evalAfter = store.getEvaluation();
    const disseccaoAfter = evalAfter.axis2Critical.find((h) => h.def.id === 'disseccao_aorta');
    expect(disseccaoAfter?.exclusionStatus?.excluded).toBeFalsy();
    // Continua no Eixo 2
    expect(evalAfter.axis2Critical.some((h) => h.def.id === 'disseccao_aorta')).toBe(true);
  });

  it('dispara alertas críticos de segurança IMEDIATAMENTE, sem exigir conclusão da entrevista', () => {
    const store = new InMemoryIDGStore(['dor_toracica']);

    // Nenhuma resposta dada ainda: nenhum alerta
    expect(store.getEvaluation().activeSafetyAlerts.length).toBe(0);

    // O médico insere apenas 2 achados graves: dor súbita e assimetria de pulsos
    store.setFinding('dor_subita_intensidade_maxima', 'presente');
    store.setFinding('assimetria_pulsos_ou_pa', 'presente');

    const evaluation = store.getEvaluation();
    expect(evaluation.activeSafetyAlerts.length).toBeGreaterThan(0);

    const alertDisseccao = evaluation.activeSafetyAlerts.find(
      (a) => a.id === 'alerta_disseccao_dor_maxima_pulsos',
    );
    expect(alertDisseccao).toBeDefined();
    expect(alertDisseccao?.severity).toBe('critica');
    expect(alertDisseccao?.immediateActionRequired).toContain('Controle rigoroso e imediato de FC');
  });

  it('impede que diagnósticos perigosos desapareçam do Eixo 2 sem critério definitivo de exclusão', () => {
    const store = new InMemoryIDGStore(['dor_abdominal']);

    // Inicialmente, Isquemia Mesentérica Aguda está no Eixo 2
    let evalState = store.getEvaluation();
    expect(evalState.axis2Critical.some((h) => h.def.id === 'isquemia_mesenterica_aguda')).toBe(true);

    // O médico relata achados sugestivos de outra patologia (ex: apendicite ou cólica biliar)
    // e o lactato vem normal (ausência de lactato elevado)
    store.setFinding('lactato_serico_elevado', 'ausente');
    store.setFinding('dor_migratoria_para_fid', 'presente');

    evalState = store.getEvaluation();

    // Apendicite subiu no Eixo 1
    expect(evalState.axis1Probable[0].def.id).toBe('apendicite_aguda');

    // Mas Isquemia Mesentérica Aguda PERMANECE no Eixo 2 (não foi excluída por angiotc)
    const isquemia = evalState.axis2Critical.find((h) => h.def.id === 'isquemia_mesenterica_aguda');
    expect(isquemia).toBeDefined();
    expect(isquemia?.exclusionStatus?.excluded).toBeFalsy();
  });

  it('permite exclusão SOMENTE quando o critério formal e definitivo for atendido', () => {
    const store = new InMemoryIDGStore(['dor_abdominal']);

    // Fornece AngioTC trifásica normal
    store.setFinding('angiotc_mesenterica_normal', 'presente');

    const evalState = store.getEvaluation();
    const isquemia = evalState.axis2Critical.find((h) => h.def.id === 'isquemia_mesenterica_aguda');

    // Agora ela foi formalmente excluída do Eixo 2
    expect(isquemia).toBeUndefined(); // Saiu do Eixo 2 ativo

    // E no Eixo 1 consta como excluída com justificativa
    const isquemiaEixo1 = evalState.axis1Probable.find((h) => h.def.id === 'isquemia_mesenterica_aguda');
    expect(isquemiaEixo1?.exclusionStatus?.excluded).toBe(true);
    expect(isquemiaEixo1?.exclusionStatus?.reason).toContain('Angiotomografia');
  });
});
