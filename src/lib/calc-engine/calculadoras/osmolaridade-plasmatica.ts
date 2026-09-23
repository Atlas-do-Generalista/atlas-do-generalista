import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const osmolaridadePlasmatica: Calculadora = {
  id: 'osmolaridade-plasmatica',
  nome: 'Osmolaridade plasmática calculada',
  categoria: 'laboratorio metabolico',
  entradas: ['sodio', 'glicemia', 'ureia'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const glicemia = dados.glicemia as number;
    const ureia = dados.ureia as number;
    const valor = 2 * na + glicemia / 18 + ureia / 6;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mOsm/L',
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico' },
        { campo: 'glicemia', valor: glicemia, descricao: 'Glicemia' },
        { campo: 'ureia', valor: ureia, descricao: 'Ureia sérica' },
      ],
      avisos: [
        'Esta fórmula utiliza ureia sérica em mg/dL. Fórmulas que usam BUN utilizam outro fator de conversão; não misture ureia e BUN na mesma equação.',
      ],
    };
  },
  interpretar: (resultado) => `Osmolaridade plasmática calculada: ${resultado.valor} mOsm/L.`,
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
