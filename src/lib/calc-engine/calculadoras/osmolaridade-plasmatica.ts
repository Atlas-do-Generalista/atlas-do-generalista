import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const osmolaridadePlasmatica: Calculadora = {
  id: 'osmolaridade-plasmatica',
  nome: 'Osmolaridade plasmática calculada',
  categoria: 'laboratorio metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'metabolismo',
  entradas: ['sodio', 'glicemia', 'ureia'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const glicemia = dados.glicemia as number;
    const ureia = dados.ureia as number;
    const valor = 2 * na + glicemia / 18 + ureia / 6;
    const valorArredondado = Number(valor.toFixed(1));

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    let status = 'Normal (275 a 295 mOsm/L)';
    if (valorArredondado > 320) {
      status = 'Hiperosmolaridade grave (>320 mOsm/L)';
      nivelGravidade = 'critico';
    } else if (valorArredondado > 295) {
      status = 'Hiperosmolaridade (>295 mOsm/L)';
      nivelGravidade = 'atencao';
    } else if (valorArredondado < 260) {
      status = 'Hipoosmolaridade grave (<260 mOsm/L)';
      nivelGravidade = 'critico';
    } else if (valorArredondado < 275) {
      status = 'Hipoosmolaridade (<275 mOsm/L)';
      nivelGravidade = 'atencao';
    }

    return {
      valor: valorArredondado,
      unidade: 'mOsm/L',
      resumo: `Osm plasmática ${valorArredondado} mOsm/L (${status})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico (2 × Na = ' + (2 * na) + ')' },
        { campo: 'glicemia', valor: glicemia, descricao: 'Glicemia (Glic/18 = ' + (glicemia / 18).toFixed(1) + ')' },
        { campo: 'ureia', valor: ureia, descricao: 'Ureia sérica (Ureia/6 = ' + (ureia / 6).toFixed(1) + ')' },
      ],
      avisos: [
        'Esta fórmula utiliza ureia sérica em mg/dL. Fórmulas que usam BUN utilizam outro fator de conversão (BUN/2,8); não misture ureia e BUN na mesma equação.',
        'A diferença entre a osmolaridade medida por osmometria e a calculada é o Osmolar Gap (normal ≤10 mOsm/L); elevações expressivas sugerem intoxicação por álcoois tóxicos (metanol, etilenoglicol).',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 275) return `Osmolaridade plasmática: ${v} mOsm/L (Hipoosmolaridade [referência: 275 a 295 mOsm/L]).`;
    if (v > 295) return `Osmolaridade plasmática: ${v} mOsm/L (Hiperosmolaridade [referência: 275 a 295 mOsm/L]; correlacione com estado de hidratação, glicemia e osmolaridade efetiva).`;
    return `Osmolaridade plasmática: ${v} mOsm/L (Normal [275 a 295 mOsm/L]).`;
  },
  populacaoAlvo: 'Adultos com sódio, glicemia e ureia séricos.',
  limitacoes: [
    'É uma estimativa; osmolalidade medida pode ser necessária quando a precisão é relevante.',
  ],
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
    if ((dados.ureia as number) < 0) erros.push('Ureia não pode ser negativa.');
    return erros;
  },
};
