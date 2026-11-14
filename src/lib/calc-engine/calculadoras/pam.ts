import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const pam: Calculadora = {
  id: 'pam',
  nome: 'Pressão Arterial Média (PAM)',
  categoria: 'hemodinamica',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'cardiovascular',
  entradas: ['pas', 'pad'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const pas = dados.pas as number;
    const pad = dados.pad as number;
    const valor = Number(((pas + 2 * pad) / 3).toFixed(1));
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    let status = 'Adequada (≥65 mmHg)';

    if (valor < 55) {
      status = 'Hipotensão grave (<55 mmHg)';
      nivelGravidade = 'critico';
    } else if (valor < 65) {
      status = 'Hipotensão (<65 mmHg)';
      nivelGravidade = 'alerta';
    } else if (valor > 120) {
      status = 'Hipertensão acentuada (>120 mmHg)';
      nivelGravidade = 'atencao';
    }

    return {
      valor,
      unidade: 'mmHg',
      resumo: `PAM ${valor} mmHg (${status})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'pas', valor: pas, descricao: 'Pressão arterial sistólica' },
        { campo: 'pad', valor: pad, descricao: 'Pressão arterial diastólica' },
        { campo: 'pam', valor, descricao: 'Fórmula padrão: (PAS + 2 × PAD) / 3' },
      ],
      avisos: [
        'Em cuidados críticos e no manejo da sepse, a meta clássica de perfusão tecidual e autorregulação renal/cerebral é manter PAM ≥65 mmHg.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 65) {
      return `PAM: ${v} mmHg (Hipotensão — abaixo do alvo hemodinâmico usual de perfusão orgânica de 65 mmHg; risco de disfunção renal e hipoperfusão tecidual).`;
    }
    return `PAM: ${v} mmHg (Adequada — atinge a meta hemodinâmica de perfusão de órgãos ≥65 mmHg).`;
  },
  populacaoAlvo: 'Adultos com aferição de pressão arterial sistólica e diastólica.',
  referencias: [
    {
      titulo: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021',
      url: 'https://doi.org/10.1097/CCM.0000000000005337',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-11-14',
  validar: (dados) => {
    const erros: string[] = [];
    if (typeof dados.pas !== 'number' || dados.pas <= 0) erros.push('PAS deve ser maior que zero.');
    if (typeof dados.pad !== 'number' || dados.pad < 0) erros.push('PAD não pode ser negativa.');
    if (typeof dados.pas === 'number' && typeof dados.pad === 'number' && dados.pas <= dados.pad) {
      erros.push('PAS deve ser maior que a PAD.');
    }
    return erros;
  },
};
