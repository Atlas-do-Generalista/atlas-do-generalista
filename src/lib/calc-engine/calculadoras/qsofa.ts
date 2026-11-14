import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

export const qsofa: Calculadora = {
  id: 'qsofa',
  nome: 'qSOFA (Quick SOFA)',
  categoria: 'gravidade',
  tipoMetrica: 'escore',
  dominioClinico: 'gravidade',
  entradas: ['fr', 'pas', 'gcs'],
  obterEntradasFaltantes: (d) => {
    const faltando: string[] = [];
    if (d.fr === null || d.fr === undefined || d.fr === '') faltando.push('fr');
    if (d.pas === null || d.pas === undefined || d.pas === '') faltando.push('pas');
    const temGcs = typeof d.gcs === 'number' && Number.isFinite(d.gcs);
    const temConsciencia = typeof d.consciencia === 'string' && d.consciencia !== '';
    if (!temGcs && !temConsciencia) faltando.push('gcs ou consciencia');
    return faltando;
  },
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const fr = dados.fr as number;
    const pas = dados.pas as number;
    const gcs = typeof dados.gcs === 'number' ? dados.gcs : (dados.consciencia === 'alerta' ? 15 : 14);

    const frPonto = fr >= 22 ? 1 : 0;
    const pasPonto = pas <= 100 ? 1 : 0;
    const gcsPonto = gcs < 15 ? 1 : 0;
    const total = frPonto + pasPonto + gcsPonto;

    const detalhes: DetalheCalculo[] = [
      { campo: 'fr', valor: fr, pontos: frPonto, descricao: 'Frequência respiratória ≥22 irpm' },
      { campo: 'pas', valor: pas, pontos: pasPonto, descricao: 'Pressão arterial sistólica ≤100 mmHg' },
      { campo: 'gcs', valor: gcs, pontos: gcsPonto, descricao: 'Escala de Glasgow <15 (ou alteração aguda do sensório)' },
    ];

    return {
      valor: total,
      unidade: 'pontos',
      resumo: `qSOFA ${total} ponto(s) — ${total >= 2 ? 'Alto risco de desfecho desfavorável / suspeita de sepse' : 'Baixo risco imediato pelo qSOFA'}`,
      nivelGravidade: total >= 2 ? 'critico' : total === 1 ? 'atencao' : 'normal',
      detalhamento: detalhes,
      avisos: [
        'qSOFA é uma ferramenta de beira-leito recomendada pelo consenso Sepsis-3 (2016) para triagem rápida de pacientes com suspeita de infecção fora da UTI.',
        'Pontuação ≥2 identifica pacientes com maior risco de internação prolongada em UTI e mortalidade intra-hospitalar. A presença de qSOFA ≥2 deve motivar avaliação imediata de disfunção orgânica pelo SOFA completo e abertura de protocolo de sepse.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v >= 2) {
      return `qSOFA: ${v} pontos (Alto risco de pior prognóstico / suspeita de sepse. Pontuação ≥2 fora da UTI indica risco elevado de mortalidade; investigar foco infeccioso e calcular SOFA completo imediatamente).`;
    }
    return `qSOFA: ${v} ponto(s) (Baixo risco imediato pelo qSOFA. Não descarta sepse; manter vigilância clínica se houver suspeita de infecção).`;
  },
  populacaoAlvo: 'Adultos com suspeita ou confirmação de infecção fora da unidade de terapia intensiva.',
  referencias: [
    {
      titulo: 'Singer M et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.',
      url: 'https://doi.org/10.1001/jama.2016.0287',
    },
  ],
  versao: 'Sepsis-3 2016',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.fr !== 'number' || d.fr < 0) erros.push('FR não pode ser negativa.');
    if (typeof d.pas !== 'number' || d.pas <= 0) erros.push('PAS deve ser maior que zero.');
    return erros;
  },
};
