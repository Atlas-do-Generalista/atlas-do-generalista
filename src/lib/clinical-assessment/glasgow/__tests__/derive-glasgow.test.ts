import { describe, it, expect } from 'vitest';
import { deriveGlasgow, resolverGcsNoContexto } from '../derive-glasgow';
import { apache2 } from '../../../calc-engine/calculadoras/apache2';
import { sofa2 } from '../../../calc-engine/calculadoras/sofa-2';

describe('Derivação do Glasgow (GCS) — Camada Clinical Assessment', () => {
  it('deve calcular corretamente a soma dos 3 componentes para Glasgow atual (O4 V5 M6 = 15)', () => {
    const res = deriveGlasgow({
      ocular: 4,
      verbal: 5,
      motor: 6,
    });

    expect(res.gcs).toBe(15);
    expect(res.origem).toBe('calculado_atual');
    expect(res.avaliacaoLimitada).toBe(false);
    expect(res.rotuloFormatado).toBe('Glasgow: 15');
    expect(res.detalhes.completo).toBe(true);
  });

  it('deve aceitar componentes como strings vindas de elementos <select> HTML', () => {
    const res = deriveGlasgow({
      ocular: '3',
      verbal: '4',
      motor: '5',
    });

    expect(res.gcs).toBe(12);
    expect(res.origem).toBe('calculado_atual');
  });

  it('deve priorizar GCS pré-sedação quando a avaliação atual estiver limitada por sedação/intubação (retrocompatível sem tempo)', () => {
    const res = deriveGlasgow({
      avaliacaoLimitada: true,
      preSedacao: 11,
      ocular: 1, // Sedado em ventilação
      verbal: 1,
      motor: 1,
    });

    expect(res.gcs).toBe(11);
    expect(res.origem).toBe('pre_sedacao');
    expect(res.avaliacaoLimitada).toBe(true);
    expect(res.rotuloFormatado).toContain('11 (pré-sedação/intubação)');
    expect(res.rastreabilidadeTemporal?.confiabilidade).toBe('tempo_nao_informado');
    expect(res.rastreabilidadeTemporal?.aviso).toContain('Momento da avaliação neurológica pré-sedação não informado');
  });

  it('deve validar rastreabilidade temporal adequada quando GCS pré-sedação foi avaliado há ≤24 horas', () => {
    const res = deriveGlasgow({
      avaliacaoLimitada: true,
      preSedacao: 14,
      preSedacaoTempoDecorridoHoras: 4, // 4 horas atrás
    });

    expect(res.gcs).toBe(14);
    expect(res.origem).toBe('pre_sedacao');
    expect(res.rastreabilidadeTemporal?.confiabilidade).toBe('adequada');
    expect(res.rastreabilidadeTemporal?.horasDecorridas).toBe(4);
    expect(res.rotuloFormatado).toContain('14 (pré-sedação/intubação)');
  });

  it('deve emitir alerta temporal quando GCS pré-sedação tiver sido avaliado há mais de 24 horas', () => {
    const res = deriveGlasgow({
      avaliacaoLimitada: true,
      preSedacao: 13,
      preSedacaoTempoDecorridoHoras: 36, // 36 horas atrás
    });

    expect(res.gcs).toBe(13);
    expect(res.origem).toBe('pre_sedacao');
    expect(res.rastreabilidadeTemporal?.confiabilidade).toBe('alerta_tempo_prolongado');
    expect(res.rastreabilidadeTemporal?.horasDecorridas).toBe(36);
    expect(res.rastreabilidadeTemporal?.aviso).toContain('>24 h');
    expect(res.rotuloFormatado).toContain('alerta temporal');
  });

  it('deve calcular horas decorridas a partir de string ISO e data/hora de referência', () => {
    const preDataHora = '2026-10-28T08:00:00Z';
    const refDataHora = '2026-10-29T14:00:00Z'; // 30 horas depois

    const res = deriveGlasgow({
      avaliacaoLimitada: true,
      preSedacao: 10,
      preSedacaoDataHora: preDataHora,
      dataHoraReferencia: refDataHora,
    });

    expect(res.gcs).toBe(10);
    expect(res.rastreabilidadeTemporal?.horasDecorridas).toBe(30);
    expect(res.rastreabilidadeTemporal?.confiabilidade).toBe('alerta_tempo_prolongado');
  });

  it('deve retornar gcs nulo quando avaliação for limitada mas não houver valor pré-sedação válido', () => {
    const res = deriveGlasgow({
      avaliacaoLimitada: 'true',
      preSedacao: null,
      ocular: 1,
    });

    expect(res.gcs).toBeNull();
    expect(res.origem).toBe('indeterminado');
    expect(res.detalhes.completo).toBe(false);
  });

  it('deve retornar gcs nulo se qualquer um dos três componentes estiver ausente em avaliação não limitada', () => {
    const res = deriveGlasgow({
      ocular: 4,
      verbal: null,
      motor: 6,
    });

    expect(res.gcs).toBeNull();
    expect(res.origem).toBe('indeterminado');
    expect(res.detalhes.completo).toBe(false);
  });

  it('integração: resolverGcsNoContexto deve alimentar adequadamente APACHE II e SOFA-2', () => {
    const contextoBruto = {
      idade: 45,
      pas: 120,
      pad: 80,
      temperatura: 37,
      fc: 75,
      fr: 16,
      fio2: 0.21,
      pao2: 95,
      ph: 7.4,
      sodio: 140,
      potassio: 4,
      creatinina: 0.9,
      hematocrito: 40,
      leucocitos: 7,
      tipo_admissao: 'clinica',
      insuficiencia_organica_grave_imunossupressao: false,
      bilirrubina: 0.8,
      plaquetas: 220,
      peso: 70,
      delirium_tratamento: false,
      suporte_ventilatorio_avancado: false,
      ecmo_respiratorio: false,
      vasoativos_em_uso: false,
      // Apenas componentes do Glasgow, sem gcs calculado explicitamente
      glasgow_ocular: 3,
      glasgow_verbal: 4,
      glasgow_motor: 5,
    };

    const gcsResolvido = resolverGcsNoContexto(contextoBruto);
    expect(gcsResolvido).toBe(12);

    const contextoComGcs = {
      ...contextoBruto,
      gcs: gcsResolvido,
    };

    // APACHE II deve calcular sem pendência de gcs (15 - 12 = 3 pontos neurológicos)
    const resApache = apache2.calcular(contextoComGcs);
    const detalheApacheGcs = resApache.detalhamento?.find((d) => d.campo === 'gcs');
    expect(detalheApacheGcs?.pontos).toBe(3);

    // SOFA-2 deve calcular domínio cerebral adequadamente (GCS 12 -> 2 pontos cerebrais)
    const resSofa = sofa2.calcular(contextoComGcs);
    const detalheSofaBrain = resSofa.detalhamento?.find((d) => d.campo === 'brain');
    expect(detalheSofaBrain?.pontos).toBe(2);
  });
});
