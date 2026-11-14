import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const calcioCorrigido: Calculadora = {
  id: 'calcio-corrigido',
  nome: 'Cálcio Corrigido pela Albumina',
  categoria: 'laboratorio e metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'metabolismo',
  entradas: ['calcio', 'albumina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const ca = dados.calcio as number;
    const alb = dados.albumina as number;
    // Fórmula de Payne: Ca_corrigido = Ca_medido + 0.8 * (4.0 - Albumina)
    const valor = Number((ca + 0.8 * (4.0 - alb)).toFixed(2));
    let classificacao = 'Normal';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';

    if (valor < 8.5) {
      classificacao = valor < 7.5 ? 'Hipocalcemia grave' : 'Hipocalcemia leve/moderada';
      nivelGravidade = valor < 7.5 ? 'critico' : 'alerta';
    } else if (valor > 10.5) {
      classificacao = valor > 12.0 ? 'Hipercalcemia grave' : 'Hipercalcemia leve/moderada';
      nivelGravidade = valor > 12.0 ? 'critico' : 'alerta';
    }

    return {
      valor,
      unidade: 'mg/dL',
      resumo: `Cálcio Corrigido ${valor} mg/dL (${classificacao})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'calcio', valor: ca, descricao: 'Cálcio sérico total medido' },
        { campo: 'albumina', valor: alb, descricao: 'Albumina sérica' },
        { campo: 'calcio_corrigido', valor, descricao: 'Cálcio corrigido (Payne: Ca + 0,8 × [4,0 − Alb])' },
      ],
      avisos: [
        'Aproximadamente 40% a 50% do cálcio sérico circula ligado a proteínas (principalmente albumina). Na hipoalbuminemia, o cálcio total pode parecer falsamente reduzido mesmo com fração ionizada normal.',
        'Em doentes graves com distúrbios ácido-base importantes, a dosagem direta de cálcio iônico é preferível.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 8.5) {
      return `Cálcio Corrigido: ${v} mg/dL (Hipocalcemia [normal: 8,5 a 10,5 mg/dL]. Avaliar sintomas neuroexcitabilidade, QT no ECG e dosagem de magnésio e cálcio iônico).`;
    }
    if (v > 10.5) {
      return `Cálcio Corrigido: ${v} mg/dL (Hipercalcemia [normal: 8,5 a 10,5 mg/dL]. Avaliar hidratação venosa e causas subjacentes como hiperparatireoidismo e neoplasia).`;
    }
    return `Cálcio Corrigido: ${v} mg/dL (Normal [8,5 a 10,5 mg/dL] — calcemia efetiva preservada após ajuste por albumina).`;
  },
  populacaoAlvo: 'Adultos com dosagens séricas simultâneas de cálcio total e albumina.',
  referencias: [
    {
      titulo: 'Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-646.',
      url: 'https://doi.org/10.1136/bmj.4.5893.643',
    },
  ],
  versao: 'Payne 1973',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.calcio !== 'number' || d.calcio <= 0) erros.push('Cálcio deve ser maior que zero.');
    if (typeof d.albumina !== 'number' || d.albumina <= 0) erros.push('Albumina deve ser maior que zero.');
    return erros;
  },
};
