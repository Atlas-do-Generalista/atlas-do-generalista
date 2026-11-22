import { describe, it, expect } from 'vitest';
import { InMemoryIDGStore } from '../state/in-memory-store';

describe('IDG — Os Quatro Módulos Clínicos Iniciais', () => {
  describe('Módulo 1 — Dor Torácica / Dissecção Aguda de Aorta', () => {
    it('Cenário Típico: dor instantânea rasgando para dorso com assimetria de pulsos', () => {
      const store = new InMemoryIDGStore(['dor_toracica']);
      store.setFinding('dor_subita_intensidade_maxima', 'presente');
      store.setFinding('dor_lancinante_rasgando_dorso', 'presente');
      store.setFinding('assimetria_pulsos_ou_pa', 'presente');

      const evaluation = store.getEvaluation();

      const disseccao = evaluation.axis1Probable.find((h) => h.def.id === 'disseccao_aorta');
      expect(disseccao).toBeDefined();
      expect(disseccao?.status).toBe('sustentada');
      expect(disseccao?.scoreProbable).toBeGreaterThanOrEqual(80);

      // Alerta crítico disparado
      expect(evaluation.activeSafetyAlerts.some((a) => a.id === 'alerta_disseccao_dor_maxima_pulsos')).toBe(true);

      // Exame emergencial recomendado
      const angioTC = evaluation.suggestedTests.find((t) => t.id === 'angiotc_aorta_toracoabdominal');
      expect(angioTC).toBeDefined();
      expect(angioTC?.priority).toBe('emergencial');
    });

    it('Cenário Falsamente Tranquilizador: RX de tórax normal NÃO exclui dissecção', () => {
      const store = new InMemoryIDGStore(['dor_toracica']);
      store.setFinding('dor_subita_intensidade_maxima', 'presente');
      store.setFinding('alargamento_mediastino_rx', 'ausente'); // RX sem alargamento de mediastino

      const evaluation = store.getEvaluation();
      const disseccao = evaluation.axis2Critical.find((h) => h.def.id === 'disseccao_aorta');

      // Continua presente e ativa no Eixo 2 porque RX normal não tem poder excludente
      expect(disseccao).toBeDefined();
      expect(disseccao?.exclusionStatus?.excluded).toBeFalsy();
    });
  });

  describe('Módulo 2 — Dor Vertebral / Compressão Medular Aguda', () => {
    it('Cenário Típico: paciente oncológico com dor noturna e fraqueza motora progressiva', () => {
      const store = new InMemoryIDGStore(['dor_vertebral']);
      store.setFinding('dor_noturna_piora_decubito', 'presente');
      store.setFinding('fraqueza_motora_mmii_progressiva', 'presente');

      const evaluation = store.getEvaluation();
      const compressao = evaluation.axis1Probable.find((h) => h.def.id === 'compressao_medular_metastatica');

      expect(compressao).toBeDefined();
      expect(compressao?.status).toBe('sustentada');

      // Alerta oncológico de emergência
      const alerta = evaluation.activeSafetyAlerts.find((a) => a.id === 'alerta_compressao_medular_emergencia');
      expect(alerta).toBeDefined();
      expect(alerta?.immediateActionRequired).toContain('Dexametasona IV');

      // RM de coluna recomendada
      expect(evaluation.suggestedTests.some((t) => t.id === 'rm_coluna_total_urgencia')).toBe(true);
    });

    it('Cenário Cauda Equina: anestesia em sela com retenção urinária', () => {
      const store = new InMemoryIDGStore(['dor_vertebral']);
      store.setFinding('anestesia_em_sela', 'presente');
      store.setFinding('retencao_urinaria_ou_bexigoma', 'presente');

      const evaluation = store.getEvaluation();
      const caudaEquina = evaluation.axis1Probable.find((h) => h.def.id === 'sindrome_cauda_equina');

      expect(caudaEquina).toBeDefined();
      expect(caudaEquina?.status).toBe('sustentada');
      expect(evaluation.activeSafetyAlerts.some((a) => a.id === 'alerta_cauda_equina_urgente')).toBe(true);
    });
  });

  describe('Módulo 3 — Dor Abdominal / Isquemia Mesentérica Aguda', () => {
    it('REGRA CRÍTICA: Lactato normal NÃO pode excluir isquemia mesentérica em paciente com dor desproporcional', () => {
      const store = new InMemoryIDGStore(['dor_abdominal']);
      // Dor severa com abdome inocente
      store.setFinding('dor_desproporcional_exame_fisico', 'presente');
      store.setFinding('fibrilacao_atrial_ou_cardiopatia_embolica', 'presente');
      // Lactato veio estritamente normal (ausência de lactato elevado)
      store.setFinding('lactato_serico_elevado', 'ausente');

      const evaluation = store.getEvaluation();
      const isquemia = evaluation.axis2Critical.find((h) => h.def.id === 'isquemia_mesenterica_aguda');

      expect(isquemia).toBeDefined();
      // Não pode constar como excluída!
      expect(isquemia?.exclusionStatus?.excluded).toBeFalsy();
      expect(isquemia?.status).toBe('sustentada'); // Continua sustentada pela dor desproporcional + FA

      // Alerta de segurança cognitiva deve estar ativo destacando a armadilha do lactato
      const alerta = evaluation.activeSafetyAlerts.find((a) => a.id === 'alerta_isquemia_mesenterica_lactato');
      expect(alerta).toBeDefined();
      expect(alerta?.description).toContain('Lactato normal ou ausência de peritonite NÃO excluem');
    });

    it('Cenário Mulher em Idade Fértil: alerta obrigatório para gravidez ectópica', () => {
      const store = new InMemoryIDGStore(['dor_abdominal']);
      store.setFinding('sangramento_vaginal_com_dor_pelvica', 'presente');
      store.setFinding('beta_hcg_positivo', 'presente');

      const evaluation = store.getEvaluation();
      const ectopica = evaluation.axis1Probable.find((h) => h.def.id === 'gravidez_ectopica_rota');

      expect(ectopica).toBeDefined();
      expect(ectopica?.status).toBe('sustentada');
      expect(evaluation.activeSafetyAlerts.some((a) => a.id === 'alerta_gravidez_ectopica')).toBe(true);
    });
  });

  describe('Módulo 4 — Suspeita de Infecção / Sepse Inicial', () => {
    it('Diferencia foco infeccioso de disfunção orgânica de gravidade', () => {
      const store = new InMemoryIDGStore(['febre']);

      // 1. Infecção sem disfunção: tosse com escarro purulento, sinais vitais normais
      store.setFinding('foco_infeccioso_identificado_ou_suspeito', 'presente');
      store.setFinding('tosse_produtiva_escarro_purulento', 'presente');
      store.setFinding('disfuncao_organica_aguda', 'ausente');

      let evalState = store.getEvaluation();
      let sepse = evalState.axis1Probable.find((h) => h.def.id === 'sepse_choque_septico');
      // Pneumonia está sustentada, sepse sem choque/disfunção não está em alerta de hora de ouro
      expect(evalState.axis1Probable[0].def.id).toBe('pneumonia_adquirida_comunidade');
      expect(evalState.activeSafetyAlerts.some((a) => a.id === 'alerta_sepse_tempo_dependente')).toBe(false);

      // 2. Agora o paciente desenvolve oligúria e tempo de enchimento capilar lentificado (> 3s)
      store.setFinding('disfuncao_organica_aguda', 'presente');
      store.setFinding('tempo_enchimento_capilar_aumentado', 'presente');

      evalState = store.getEvaluation();
      sepse = evalState.axis1Probable.find((h) => h.def.id === 'sepse_choque_septico');

      // Sepse passa a estar sustentada com alerta imediato da Golden Hour
      expect(sepse?.status).toBe('sustentada');
      expect(evalState.activeSafetyAlerts.some((a) => a.id === 'alerta_sepse_tempo_dependente')).toBe(true);
      expect(evalState.activeSafetyAlerts[0].immediateActionRequired).toContain('Golden Hour');
    });

    it('Identifica anafilaxia como mimetizador de sepse distributiva', () => {
      const store = new InMemoryIDGStore(['febre', 'choque']);
      store.setFinding('exposicao_alergeno_recente_minutos', 'presente');
      store.setFinding('angioedema_urticaria_ou_estridor', 'presente');
      store.setFinding('febre_alta_calafrios_prolongados', 'ausente');

      const evaluation = store.getEvaluation();
      const anafilaxia = evaluation.axis1Probable.find((h) => h.def.id === 'anafilaxia_mimetizador_sepse');

      expect(anafilaxia).toBeDefined();
      expect(anafilaxia?.status).toBe('sustentada');
      expect(evaluation.activeSafetyAlerts.some((a) => a.id === 'alerta_anafilaxia_adrenalina')).toBe(true);
    });
  });
});
