import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const sodioCorrigidoGlicemia: Calculadora = {
  id: 'sodio-corrigido-glicemia',
  nome: 'Sódio corrigido pela glicemia',
  categoria: 'laboratorio metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'metabolismo',
  entradas: ['sodio', 'glicemia'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const glicemia = dados.glicemia as number;
    const valor = glicemia > 100
      ? na + 2.4 * ((glicemia - 100) / 100)
      : na;
    const valorArredondado = Number(valor.toFixed(1));

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    if (valorArredondado < 125 || valorArredondado > 155) nivelGravidade = 'critico';
    else if (valorArredondado < 130 || valorArredondado > 148) nivelGravidade = 'alerta';
    else if (valorArredondado < 135 || valorArredondado > 145) nivelGravidade = 'atencao';

    return {
      valor: valorArredondado,
      unidade: 'mEq/L',
      resumo: `Na corrigido ${valorArredondado} mEq/L (medido ${na} mEq/L com glicemia ${glicemia} mg/dL)`,
      nivelGravidade,
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico medido' },
        { campo: 'glicemia', valor: glicemia, descricao: 'Glicemia atual' },
        { campo: 'fator', valor: 2.4, descricao: 'Fator de Hillier (2,4 mEq/L por 100 mg/dL acima de 100)' },
      ],
      avisos: [
        'A hiperglicemia induz deslocamento osmótico de água do espaço intracelular para o extracelular, diluindo o sódio sérico mensurado.',
        'A implementação utiliza o fator validado de Hillier (2,4 mEq/L para cada 100 mg/dL de glicose acima de 100 mg/dL).',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 135) return `Sódio corrigido pela glicemia: ${v} mEq/L (Hiponatremia verdadeira residual após correção da hiperglicemia).`;
    if (v > 145) return `Sódio corrigido pela glicemia: ${v} mEq/L (Hipernatremia oculta — o paciente apresenta na verdade déficit relativo de água livre desmascarado pela correção da glicose).`;
    return `Sódio corrigido pela glicemia: ${v} mEq/L (Eunatremia — a hiponatremia medida é puramente translacional/osmótica secundária à hiperglicemia).`;
  },
  populacaoAlvo: 'Adultos com hiperglicemia e hiponatremia/necessidade de estimar o sódio após correção pela glicose.',
  limitacoes: [
    'Fatores de correção variam entre fontes; o resultado não deve ser comparado com fórmulas de fator diferente sem identificar o método.',
  ],
  referencias: [
    {
      titulo: 'Hillier TA, Abbott RD, Barrett EJ. Hyponatremia: evaluating the correction factor for hyperglycemia. Am J Med. 1999.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10225241/',
    },
  ],
  versao: 'Hillier 2,4',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.sodio as number) <= 0) erros.push('Sódio deve ser maior que zero.');
    if ((dados.glicemia as number) < 0) erros.push('Glicemia não pode ser negativa.');
    return erros;
  },
};
