import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const hiss: Calculadora = {
  id: 'hiss',
  nome: 'HISS (Head Injury Severity Scale)',
  categoria: 'avaliacoes neurologicas e especificas',
  entradas: ['hiss_gcs_inicial', 'hiss_perda_consciencia_minutos', 'hiss_amnesia', 'hiss_reacao_lenta', 'hiss_deficit_focal'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const gcs = dados.hiss_gcs_inicial as number;
    const locMin = dados.hiss_perda_consciencia_minutos as number;
    const amnesia = dados.hiss_amnesia === true;
    const reacaoLenta = dados.hiss_reacao_lenta === true;
    const focal = dados.hiss_deficit_focal === true;

    let categoria: string;
    if (gcs >= 3 && gcs <= 4) {
      categoria = 'crítica';
    } else if (gcs >= 5 && gcs <= 8) {
      categoria = 'grave';
    } else if (gcs >= 9 && gcs <= 13 || locMin >= 5 || focal) {
      categoria = 'moderada';
    } else if (gcs === 14 || (gcs === 15 && (locMin > 0 || amnesia || reacaoLenta))) {
      categoria = 'leve';
    } else {
      categoria = 'mínima';
    }

    return {
      valor: gcs,
      unidade: 'GCS',
      resumo: `HISS: lesão craniana ${categoria}`,
      detalhamento: [
        { campo: 'hiss_gcs_inicial', valor: gcs, descricao: 'GCS inicial pós-ressuscitação' },
        { campo: 'hiss_perda_consciencia_minutos', valor: locMin, descricao: 'Perda de consciência (minutos)' },
        { campo: 'hiss_amnesia', valor: amnesia, descricao: 'Amnésia/alteração de memória' },
        { campo: 'hiss_reacao_lenta', valor: reacaoLenta, descricao: 'Resposta/alerta lentificados' },
        { campo: 'hiss_deficit_focal', valor: focal, descricao: 'Déficit neurológico focal' },
      ],
      avisos: [
        'Esta implementação calcula a dimensão de gravidade da HISS baseada no GCS inicial pós-ressuscitação e nos modificadores clínicos descritos nas classificações publicadas.',
        'O HISS original é uma classificação de lesão craniana e possui também uma dimensão de complicações; ela não é reduzida a um único escore numérico nesta implementação.',
      ],
    };
  },
  interpretar: (resultado) => resultado.resumo ?? `HISS: GCS inicial ${resultado.valor}.`,
  populacaoAlvo: 'Adultos com traumatismo cranioencefálico/lesão craniana aguda.',
  limitacoes: [
    'HISS não deve substituir protocolos contemporâneos de manejo do TCE, seleção de TC ou avaliação neurocirúrgica.',
    'A implementação resume a classificação de gravidade e não representa integralmente a dimensão de complicações do instrumento original.',
  ],
  referencias: [
    {
      titulo: 'Stein SC, Spettell C. The Head Injury Severity Scale (HISS): a practical classification of closed-head injury. Brain Inj. 1995.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/7550215/',
    },
    {
      titulo: 'Scandinavian guidelines for initial management of minimal, mild and moderate head injuries in adults',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/3621842/',
    },
  ],
  versao: 'HISS / Stein-Spettell',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    const gcs = dados.hiss_gcs_inicial as number;
    const loc = dados.hiss_perda_consciencia_minutos as number;
    if (!Number.isInteger(gcs) || gcs < 3 || gcs > 15) erros.push('GCS inicial da HISS deve estar entre 3 e 15.');
    if (loc < 0) erros.push('Duração da perda de consciência não pode ser negativa.');
    return erros;
  },
};
