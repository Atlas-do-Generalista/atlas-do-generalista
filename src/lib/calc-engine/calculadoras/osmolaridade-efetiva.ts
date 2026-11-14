import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const osmolaridadeEfetiva: Calculadora = {
  id: 'osmolaridade-efetiva',
  nome: 'Osmolaridade efetiva (tonicidade)',
  categoria: 'laboratorio metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'metabolismo',
  entradas: ['sodio', 'glicemia'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const glicemia = dados.glicemia as number;
    const valor = 2 * na + glicemia / 18;
    const valorArredondado = Number(valor.toFixed(1));

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    let status = 'Normal (270 a 285 mOsm/L)';
    if (valorArredondado > 320) {
      status = 'Hipertonicidade grave (>320 mOsm/L)';
      nivelGravidade = 'critico';
    } else if (valorArredondado > 285) {
      status = 'Hipertonicidade (>285 mOsm/L)';
      nivelGravidade = 'atencao';
    } else if (valorArredondado < 270) {
      status = 'Hipotonicidade (<270 mOsm/L)';
      nivelGravidade = 'atencao';
    }

    return {
      valor: valorArredondado,
      unidade: 'mOsm/L',
      resumo: `Tonicidade ${valorArredondado} mOsm/L (${status})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico (2 × Na = ' + (2 * na) + ')' },
        { campo: 'glicemia', valor: glicemia, descricao: 'Glicemia (Glic/18 = ' + (glicemia / 18).toFixed(1) + ')' },
      ],
      avisos: [
        'A osmolaridade efetiva (tonicidade) exclui a ureia porque a ureia atravessa livremente as membranas celulares e não exerce gradiente osmótico efetivo para movimentação de água entre os compartimentos intra e extracelular.',
        'Valores >320 mOsm/L definem hiperosmolaridade grave (ex.: Estado Hiperglicêmico Hiperosmolar), associando-se a alteração aguda do nível de consciência e risco de colapso circulatório.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v > 320) return `Osmolaridade efetiva (tonicidade): ${v} mOsm/L (Hipertonicidade grave [>320 mOsm/L] — critério clássico de Estado Hiperglicêmico Hiperosmolar; risco iminente de coma e desidratação neuronal).`;
    if (v > 285) return `Osmolaridade efetiva (tonicidade): ${v} mOsm/L (Hipertonicidade [referência: 270 a 285 mOsm/L] — induz desidratação celular osmótica).`;
    if (v < 270) return `Osmolaridade efetiva (tonicidade): ${v} mOsm/L (Hipotonicidade [referência: 270 a 285 mOsm/L] — induz influxo de água para o compartimento intracelular; risco de edema cerebral em hiponatremia hipotônica aguda).`;
    return `Osmolaridade efetiva (tonicidade): ${v} mOsm/L (Normal [270 a 285 mOsm/L] — equilíbrio osmótico efetivo preservado).`;
  },
  populacaoAlvo: 'Adultos com sódio e glicemia séricos.',
  referencias: [
    {
      titulo: 'Serum Osmolality / Osmolarity — equações clínicas de cálculo',
      url: 'https://www.mdcalc.com/calc/26/serum-osmolality-osmolarity',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.sodio as number) <= 0) erros.push('Sódio deve ser maior que zero.');
    if ((dados.glicemia as number) < 0) erros.push('Glicemia não pode ser negativa.');
    return erros;
  },
};
