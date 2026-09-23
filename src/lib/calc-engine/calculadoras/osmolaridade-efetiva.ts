import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const osmolaridadeEfetiva: Calculadora = {
  id: 'osmolaridade-efetiva',
  nome: 'Osmolaridade efetiva (tonicidade)',
  categoria: 'laboratorio metabolico',
  entradas: ['sodio', 'glicemia'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const glicemia = dados.glicemia as number;
    const valor = 2 * na + glicemia / 18;

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mOsm/L',
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico' },
        { campo: 'glicemia', valor: glicemia, descricao: 'Glicemia' },
      ],
      avisos: [
        'A osmolaridade efetiva exclui a contribuição da ureia porque a ureia atravessa membranas celulares e tem menor efeito sobre a tonicidade efetiva.',
      ],
    };
  },
  interpretar: (resultado) => `Osmolaridade efetiva estimada: ${resultado.valor} mOsm/L.`,
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
