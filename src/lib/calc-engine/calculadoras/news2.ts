import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

function pontuarFR(fr: number): number {
  if (fr <= 8) return 3;
  if (fr <= 11) return 1;
  if (fr <= 20) return 0;
  if (fr <= 24) return 2;
  return 3;
}

function pontuarSpO2(spo2: number): number {
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}

function pontuarPAS(pas: number): number {
  if (pas <= 90) return 3;
  if (pas <= 100) return 2;
  if (pas <= 110) return 1;
  if (pas <= 219) return 0;
  return 3;
}

function pontuarFC(fc: number): number {
  if (fc <= 40) return 3;
  if (fc <= 50) return 1;
  if (fc <= 90) return 0;
  if (fc <= 110) return 1;
  if (fc <= 130) return 2;
  return 3;
}

function pontuarTemperatura(temperatura: number): number {
  if (temperatura <= 35) return 3;
  if (temperatura <= 36) return 1;
  if (temperatura <= 38) return 0;
  if (temperatura <= 39) return 1;
  return 2;
}

function pontuarConsciencia(consciencia: ContextoPaciente['consciencia']): number {
  return consciencia === 'alerta' ? 0 : 3;
}

function calcularNews2(dados: ContextoPaciente): ResultadoCalculadora {
  const fr = dados.fr as number;
  const spo2 = dados.spo2 as number;
  const pas = dados.pas as number;
  const fc = dados.fc as number;
  const temperatura = dados.temperatura as number;
  const consciencia = dados.consciencia;
  const oxigenio = dados.o2_suplementar as boolean;

  const detalhes: DetalheCalculo[] = [
    { campo: 'fr', valor: fr, pontos: pontuarFR(fr), descricao: 'Frequência respiratória' },
    { campo: 'spo2', valor: spo2, pontos: pontuarSpO2(spo2), descricao: 'SpO₂ — escala 1' },
    { campo: 'pas', valor: pas, pontos: pontuarPAS(pas), descricao: 'Pressão arterial sistólica' },
    { campo: 'fc', valor: fc, pontos: pontuarFC(fc), descricao: 'Frequência cardíaca' },
    { campo: 'temperatura', valor: temperatura, pontos: pontuarTemperatura(temperatura), descricao: 'Temperatura' },
    { campo: 'consciencia', valor: consciencia, pontos: pontuarConsciencia(consciencia), descricao: 'Consciência' },
    { campo: 'o2_suplementar', valor: oxigenio, pontos: oxigenio ? 2 : 0, descricao: 'Oxigênio suplementar' },
  ];

  const valor = detalhes.reduce((total, item) => total + (item.pontos ?? 0), 0);
  const temGatilho3 = detalhes.some((d) => d.pontos === 3);

  let resumoTexto = '';
  let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';

  if (valor >= 7) {
    resumoTexto = 'Risco alto de deterioração clínica';
    nivelGravidade = 'critico';
  } else if (valor >= 5) {
    resumoTexto = 'Risco moderado de deterioração clínica';
    nivelGravidade = 'alerta';
  } else if (temGatilho3) {
    resumoTexto = 'Risco moderado (alerta por parâmetro extremo isolado de 3 pts)';
    nivelGravidade = 'alerta';
  } else if (valor >= 1) {
    resumoTexto = 'Risco baixo de deterioração clínica';
    nivelGravidade = 'atencao';
  } else {
    resumoTexto = 'Risco baixo (estabilidade clínica)';
    nivelGravidade = 'normal';
  }

  const avisos = [
    'Esta implementação utiliza a SpO₂ Scale 1 do NEWS2. A Scale 2 para pacientes com insuficiência respiratória hipercápnica conhecida não é selecionada automaticamente.',
  ];

  if (temGatilho3 && valor < 5) {
    avisos.push(
      'ALERTA DE PARÂMETRO EXTREMO: Embora o escore total seja menor que 5 pontos, a presença de uma pontuação máxima individual (3 pontos em um único parâmetro vital) configura gatilho clínico vermelho e exige revisão médica urgente.',
    );
  }

  return {
    valor,
    unidade: 'pontos',
    resumo: `NEWS2 ${valor} pontos (${resumoTexto})`,
    nivelGravidade,
    detalhamento: detalhes,
    avisos,
  };
}

export const news2: Calculadora = {
  id: 'news2',
  nome: 'NEWS2',
  categoria: 'gravidade',
  tipoMetrica: 'escore',
  dominioClinico: 'gravidade',
  entradas: ['fr', 'spo2', 'pas', 'fc', 'temperatura', 'consciencia', 'o2_suplementar'],
  calcular: calcularNews2,
  interpretar: (resultado) => {
    const val = Number(resultado.valor);
    const temGatilho3 = resultado.detalhamento?.some((d) => d.pontos === 3);

    if (val >= 7) {
      return `NEWS2: ${val} pontos (Risco alto de deterioração clínica, necessitando de equipe com competência em cuidados críticos).`;
    }
    if (val >= 5) {
      return `NEWS2: ${val} pontos (Risco moderado de deterioração clínica, necessitando de revisão médica urgente).`;
    }
    if (temGatilho3) {
      return `NEWS2: ${val} pontos (Risco moderado por parâmetro individual extremo [3 pontos], necessitando de revisão médica urgente).`;
    }
    return `NEWS2: ${val} pontos (Risco baixo de deterioração clínica, manter reavaliação periódica).`;
  },
  populacaoAlvo: 'Adultos com doença aguda; a aplicabilidade deve considerar o contexto clínico e as populações excluídas/adaptadas pelo protocolo local.',
  limitacoes: [
    'A implementação utiliza a SpO₂ Scale 1; a Scale 2 exige identificação clínica específica de insuficiência respiratória hipercápnica.',
    'Não utilizar como substituto de avaliação clínica ou protocolo de deterioração aguda.',
  ],
  referencias: [
    {
      titulo: 'Royal College of Physicians — National Early Warning Score (NEWS) 2',
      url: 'https://www.rcplondon.ac.uk/media/a4ibkkbf/news2-final-report_0_0.pdf',
    },
    {
      titulo: 'Royal College of Physicians — NEWS2 scoring chart',
      url: 'https://www.rcplondon.ac.uk/media/alxev00t/news2-chart-1_the-news-scoring-system_0_0.pdf',
    },
  ],
  versao: '2',
  ultimaRevisao: '2026-11-14',
  validar: (dados) => {
    const erros: string[] = [];
    if (typeof dados.fr !== 'number' || dados.fr < 0) erros.push('FR não pode ser negativa.');
    if (typeof dados.spo2 !== 'number' || dados.spo2 < 0 || dados.spo2 > 100) erros.push('SpO₂ deve estar entre 0% e 100%.');
    if (typeof dados.pas !== 'number' || dados.pas <= 0) erros.push('PAS deve ser maior que zero.');
    if (typeof dados.fc !== 'number' || dados.fc < 0) erros.push('FC não pode ser negativa.');
    if (typeof dados.temperatura !== 'number' || dados.temperatura < 25 || dados.temperatura > 45) erros.push('Temperatura fora do intervalo plausível.');
    return erros;
  },
};
