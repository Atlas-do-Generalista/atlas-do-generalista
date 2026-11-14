import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

/**
 * Calculadora de Peso Corporal Ajustado (ABW / Adjusted Body Weight).
 *
 * Fórmula clássica: ABW = IBW + 0.4 * (TBW - IBW)
 * Referências metodológicas: Bauer et al., 1983; Pai & Paloucek, 2000; Devine, 1974.
 *
 * Regras clínicas de segurança:
 * 1. O peso ajustado é aplicável EXCLUSIVAMENTE quando o peso real supera o peso ideal (TBW > IBW).
 * 2. Em pacientes com peso real menor ou igual ao peso ideal (eutróficos ou desnutridos), a fórmula
 *    produziria um valor paradoxalmente maior que o peso real, incorrendo em risco de intoxicação
 *    medicamentosa (ex.: aminoglicosídeos). Nesses casos, o ajuste não é aplicável e utiliza-se o peso real.
 * 3. A fórmula de Devine foi formulada para indivíduos com altura ≥ 60 polegadas (152,4 cm).
 */
export const pesoAjustado: Calculadora = {
  id: 'peso-ajustado',
  nome: 'Peso ajustado (fator 0,4)',
  categoria: 'antropometria',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'antropometria',
  entradas: ['sexo', 'altura', 'peso'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const altura = dados.altura as number;
    const peso = dados.peso as number;
    const sexo = dados.sexo;
    const polegadas = altura / 2.54;
    const acima60 = polegadas - 60;
    const pesoIdeal = sexo === 'masculino'
      ? 50 + 2.3 * acima60
      : 45.5 + 2.3 * acima60;

    const avisos: string[] = [];

    // Salvaguarda para altura < 152,4 cm (5 pés)
    if (altura < 152.4) {
      avisos.push(
        'Altura inferior a 152,4 cm (5 pés): a fórmula de Devine para peso ideal foi calibrada para estaturas ≥152,4 cm. Estimativas abaixo desse limiar possuem validação metodológica limitada.',
      );
    }

    // Salvaguarda clínica contra o comportamento paradoxal quando TBW <= IBW
    if (peso <= pesoIdeal) {
      avisos.push(
        'Não aplicável: o peso ajustado é indicado exclusivamente quando o peso real excede o peso ideal (sobrepeso/obesidade). Em pacientes com peso ≤ peso ideal, aplicar a fórmula geraria um valor paradoxal superior ao peso real; deve-se utilizar o peso corporal total (real).',
      );

      return {
        valor: Number(peso.toFixed(1)),
        unidade: 'kg',
        resumo: 'Peso ajustado não aplicável (peso atual ≤ peso ideal). Utilizar peso real.',
        detalhamento: [
          { campo: 'peso', valor: peso, descricao: 'Peso corporal atual (adotado diretamente)' },
          { campo: 'peso_ideal', valor: Number(pesoIdeal.toFixed(1)), descricao: 'Peso ideal de Devine' },
          { campo: 'status', valor: 'TBW <= IBW', descricao: 'Ajuste não indicado (risco de superdosagem se ajustado)' },
        ],
        avisos,
      };
    }

    const valor = pesoIdeal + 0.4 * (peso - pesoIdeal);

    avisos.push(
      'O fator de 0,4 é a convenção farmacocinética clássica (Bauer et al., 1983) para ajuste posológico em sobrepeso/obesidade (ex.: aminoglicosídeos). Protocolos institucionais específicos podem utilizar outros fatores conforme o fármaco.',
    );

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'kg',
      resumo: `Peso ajustado: ${valor.toFixed(1)} kg.`,
      detalhamento: [
        { campo: 'peso', valor: peso, descricao: 'Peso corporal atual' },
        { campo: 'peso_ideal', valor: Number(pesoIdeal.toFixed(1)), descricao: 'Peso ideal de Devine' },
        { campo: 'fator', valor: 0.4, descricao: 'Fator de ajuste' },
      ],
      avisos,
    };
  },
  interpretar: (resultado) =>
    resultado.resumo ?? `Peso ajustado estimado: ${resultado.valor} kg.`,
  populacaoAlvo: 'Adultos com sobrepeso ou obesidade (peso atual > peso ideal) necessitando de ajuste posológico específico.',
  limitacoes: [
    'Não é aplicável quando o peso atual é menor ou igual ao peso ideal.',
    'A fórmula de Devine subjacente não foi originalmente validada para estaturas inferiores a 152,4 cm.',
    'Diferentes fármacos podem exigir fatores distintos de ajuste ou o uso de peso ideal/real.',
  ],
  referencias: [
    {
      titulo: 'Bauer LA et al. Influence of weight on aminoglycoside pharmacokinetics in normal, obese, and morbidly obese patients. Clin Pharmacokinet. 1983;8(5):413-418.',
      url: 'https://doi.org/10.2165/00003088-198308050-00004',
    },
    {
      titulo: 'Pai MP, Paloucek FP. The origin of the "ideal" body weight equations. Ann Pharmacother. 2000;34(9):1066-1069.',
      url: 'https://doi.org/10.1345/aph.19381',
    },
    {
      titulo: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.',
      url: 'https://doi.org/10.1177/106002807400801104',
    },
  ],
  versao: 'Devine + fator 0,4 com salvaguarda clínica',
  ultimaRevisao: '2026-10-29',
  validar: (dados) => {
    const erros: string[] = [];
    if (dados.sexo !== 'feminino' && dados.sexo !== 'masculino') erros.push('Selecione feminino ou masculino.');
    if (typeof dados.altura !== 'number' || dados.altura <= 0) erros.push('Altura deve ser maior que zero.');
    if (typeof dados.altura === 'number' && (dados.altura < 100 || dados.altura > 250)) {
      erros.push('Altura fora do intervalo biológico plausível para adultos (100 a 250 cm).');
    }
    if (typeof dados.peso !== 'number' || dados.peso <= 0) erros.push('Peso deve ser maior que zero.');
    if (typeof dados.peso === 'number' && (dados.peso < 20 || dados.peso > 500)) {
      erros.push('Peso fora do intervalo biológico plausível para adultos (20 a 500 kg).');
    }
    if (typeof dados.idade === 'number' && dados.idade < 18) erros.push('Esta implementação é destinada a adultos.');
    return erros;
  },
};
