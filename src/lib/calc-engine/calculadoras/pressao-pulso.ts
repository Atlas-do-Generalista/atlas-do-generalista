import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const pressaoPulso: Calculadora = {
  id: 'pressao-pulso',
  nome: 'Pressão de Pulso (PP)',
  categoria: 'hemodinamica',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'cardiovascular',
  entradas: ['pas', 'pad'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const pas = dados.pas as number;
    const pad = dados.pad as number;
    const valor = Number((pas - pad).toFixed(1));
    let classificacao = 'Normal';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' = 'normal';

    if (valor > 60) {
      classificacao = 'Divergente / aumentada (>60 mmHg)';
      nivelGravidade = 'atencao';
    } else if (valor < 30) {
      classificacao = 'Convergente / reduzida (<30 mmHg)';
      nivelGravidade = 'alerta';
    }

    return {
      valor,
      unidade: 'mmHg',
      resumo: `Pressão de Pulso ${valor} mmHg (${classificacao})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'pas', valor: pas, descricao: 'Pressão arterial sistólica' },
        { campo: 'pad', valor: pad, descricao: 'Pressão arterial diastólica' },
      ],
      avisos: [
        'A pressão de pulso reflete o volume sistólico ejetado e a complacência da árvore arterial elástica.',
        'Valores <30 mmHg (convergente) sugerem baixo volume ejetado, choque cardiogênico, hipovolemia severa ou tamponamento pericárdico.',
        'Valores >60 mmHg (divergente) associam-se a rigidez aórtica pelo envelhecimento, insuficiência aórtica importante ou estados hiperdinâmicos (sepse inicial, tireotoxicose).',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 30) {
      return `Pressão de Pulso: ${v} mmHg (Convergente / estreita — sugere baixo débito cardíaco, choque cardiogênico, hipovolemia severa ou tamponamento).`;
    }
    if (v > 60) {
      return `Pressão de Pulso: ${v} mmHg (Divergente / ampla — associada a rigidez arterial em idosos, insuficiência aórtica ou estado hiperdinâmico).`;
    }
    return `Pressão de Pulso: ${v} mmHg (Normal [30 a 50 mmHg] — complacência vascular e volume de ejeção preservados).`;
  },
  populacaoAlvo: 'Adultos com aferição de pressão arterial sistólica e diastólica.',
  referencias: [
    {
      titulo: 'Franklin SS et al. Hemodynamic patterns of age-related changes in blood pressure: The Framingham Heart Study. Circulation. 1997;96(1):308-315.',
      url: 'https://doi.org/10.1161/01.cir.96.1.308',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.pas !== 'number' || d.pas <= 0) erros.push('PAS deve ser maior que zero.');
    if (typeof d.pad !== 'number' || d.pad < 0) erros.push('PAD não pode ser negativa.');
    if (typeof d.pas === 'number' && typeof d.pad === 'number' && d.pas <= d.pad) {
      erros.push('PAS deve ser maior que a PAD.');
    }
    return erros;
  },
};
