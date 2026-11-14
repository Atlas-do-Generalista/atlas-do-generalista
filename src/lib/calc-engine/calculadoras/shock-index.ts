import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const shockIndex: Calculadora = {
  id: 'shock-index',
  nome: 'Shock Index (Índice de Choque)',
  categoria: 'hemodinamica',
  tipoMetrica: 'indice',
  dominioClinico: 'cardiovascular',
  entradas: ['fc', 'pas'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const fc = dados.fc as number;
    const pas = dados.pas as number;
    const valor = Number((fc / pas).toFixed(2));
    let classificacao = 'Normal';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';

    if (valor > 1.4) {
      classificacao = 'Choque grave (>1,40)';
      nivelGravidade = 'critico';
    } else if (valor > 0.9) {
      classificacao = 'Alterado (>0,90) — hipoperfusão oculta';
      nivelGravidade = 'alerta';
    } else if (valor > 0.7) {
      classificacao = 'Limítrofe (0,71 a 0,90)';
      nivelGravidade = 'atencao';
    } else {
      classificacao = 'Normal (0,50 a 0,70)';
      nivelGravidade = 'normal';
    }

    return {
      valor,
      unidade: 'FC/PAS',
      resumo: `Shock Index ${valor} (${classificacao})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'fc', valor: fc, descricao: 'Frequência cardíaca (bpm)' },
        { campo: 'pas', valor: pas, descricao: 'Pressão arterial sistólica (mmHg)' },
        { campo: 'shock_index', valor, descricao: 'Relação FC/PAS' },
      ],
      avisos: [
        'A faixa fisiológica de normalidade é de 0,50 a 0,70. Valores >0,90 identificam precocemente hipoperfusão tecidual e choque compensado, antes mesmo da queda evidente da PA sistólica.',
        'Valores >1,40 denotam instabilidade crítica, risco imediato de colapso circulatório e mortalidade elevada em trauma e choque séptico.',
      ],
    };
  },
  interpretar: (resultado) => {
    const val = Number(resultado.valor);
    if (val > 1.4) {
      return `Shock Index: ${val} (Choque grave [>1,40] — risco crítico de colapso circulatório e elevada mortalidade; requer ressuscitação hemodinâmica e suporte intensivo imediatos).`;
    }
    if (val > 0.9) {
      return `Shock Index: ${val} (Alterado [>0,90] — indicativo de hipoperfusão tecidual oculta ou choque inicial; avaliar ressuscitação volêmica e causa subjacente).`;
    }
    if (val > 0.7) {
      return `Shock Index: ${val} (Limítrofe [0,71 a 0,90] — monitorar tendência temporal e sinais sutis de má perfusão periférica).`;
    }
    return `Shock Index: ${val} (Normal [0,50 a 0,70] — estabilidade hemodinâmica basal).`;
  },
  populacaoAlvo: 'Adultos com frequência cardíaca e pressão arterial sistólica disponíveis.',
  limitacoes: [
    'O valor isolado não estabelece diagnóstico etiológico de choque e deve ser interpretado junto à história clínica, lactato e perfusão periférica.',
    'Pode ser falsamente atenuado pelo uso de betabloqueadores ou marcapasso.',
  ],
  referencias: [
    {
      titulo: 'Allgöwer M, Burri C. "Schockindex". Dtsch Med Wochenschr. 1967;92(43):1947-1950.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/960055/',
    },
    {
      titulo: 'Rady MY et al. A clinical evaluation of the shock index for the early detection of occult shock in trauma. Ann Emerg Med. 1994;24(6):1085-1089.',
      url: 'https://doi.org/10.1016/s0196-0644(94)70233-1',
    },
  ],
  versao: 'Allgöwer 1967',
  ultimaRevisao: '2026-11-14',
  validar: (dados) => {
    if ((dados.pas as number) <= 0) return ['PAS deve ser maior que zero.'];
    if ((dados.fc as number) < 0) return ['FC não pode ser negativa.'];
    return [];
  },
};
