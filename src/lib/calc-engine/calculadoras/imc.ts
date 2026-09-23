import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const imc: Calculadora = {
  id: 'imc',
  nome: 'Índice de massa corporal (IMC)',
  categoria: 'antropometria',
  entradas: ['peso', 'altura'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const peso = dados.peso as number;
    const altura = dados.altura as number;
    const alturaM = altura / 100;
    const valor = peso / (alturaM * alturaM);

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'kg/m²',
      detalhamento: [
        { campo: 'peso', valor: peso, descricao: 'Peso' },
        { campo: 'altura', valor: altura, descricao: 'Altura' },
      ],
      avisos: [
        'As categorias de IMC variam conforme idade, gestação e população; a classificação automática aqui não substitui a interpretação clínica contextual.',
      ],
    };
  },
  interpretar: (resultado) => `IMC: ${resultado.valor} kg/m². Interprete conforme idade, gestação e contexto clínico.`,
  populacaoAlvo: 'Cálculo antropométrico; a interpretação categórica deve considerar a população.',
  limitacoes: [
    'IMC não distingue massa muscular, gordura e retenção hídrica.',
    'Pontos de corte de adultos não devem ser aplicados diretamente a crianças/adolescentes ou durante a gestação.',
  ],
  referencias: [
    {
      titulo: 'WHO — Body mass index (BMI)',
      url: 'https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index',
    },
  ],
  versao: '1',
  ultimaRevisao: '2026-09-22',
  validar: (dados) => {
    const erros: string[] = [];
    if ((dados.peso as number) <= 0) erros.push('Peso deve ser maior que zero.');
    if ((dados.altura as number) <= 0) erros.push('Altura deve ser maior que zero.');
    return erros;
  },
};
