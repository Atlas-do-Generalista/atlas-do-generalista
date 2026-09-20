import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

/** CKD-EPI 2021 baseada em creatinina, sem coeficiente racial. */
export const ckdEpi2021: Calculadora = {
  id: 'ckd-epi-2021',
  nome: 'CKD-EPI 2021 (creatinina)',
  categoria: 'funcao renal',
  entradas: ['idade', 'sexo', 'creatinina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const idade = dados.idade as number;
    const sexo = dados.sexo;
    const creatinina = dados.creatinina as number;

    const kappa = sexo === 'feminino' ? 0.7 : 0.9;
    const alpha = sexo === 'feminino' ? -0.241 : -0.302;

    const ratio = creatinina / kappa;
    const valor =
      142 *
      Math.pow(Math.min(ratio, 1), alpha) *
      Math.pow(Math.max(ratio, 1), -1.2) *
      Math.pow(0.9938, idade) *
      (sexo === 'feminino' ? 1.012 : 1);

    return {
      valor: Number(valor.toFixed(1)),
      unidade: 'mL/min/1,73 m²',
      detalhamento: [
        { campo: 'idade', valor: idade, descricao: 'Idade' },
        { campo: 'sexo', valor: sexo, descricao: 'Sexo utilizado na equação' },
        { campo: 'creatinina', valor: creatinina, descricao: 'Creatinina sérica padronizada' },
      ],
      avisos: [
        'A equação é destinada a adultos e utiliza creatinina sérica padronizada.',
        'Uma TFGe isolada não estabelece diagnóstico de doença renal crônica sem o contexto clínico apropriado.',
      ],
    };
  },
  interpretar: (resultado) => `TFGe CKD-EPI 2021: ${resultado.valor} mL/min/1,73 m². A classificação e o diagnóstico de DRC dependem do contexto clínico e da persistência das alterações.`,
  populacaoAlvo: 'Adultos (≥18 anos).',
  limitacoes: [
    'Não é a ferramenta destinada para menores de 18 anos.',
    'Usar creatinina sérica padronizada; extremos de massa muscular, dieta e outras condições podem afetar a estimativa.',
  ],
  referencias: [
    {
      titulo: 'National Kidney Foundation — CKD-EPI Creatinine Equation (2021)',
      url: 'https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021',
    },
    {
      titulo: 'KDIGO 2024 CKD Guideline',
      url: 'https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf',
    },
  ],
  versao: '2021',
  ultimaRevisao: '2026-09-19',
  validar: (dados) => {
    const erros: string[] = [];
    const idade = dados.idade as number;
    const creatinina = dados.creatinina as number;

    if (idade < 18) erros.push('CKD-EPI 2021 de creatinina não deve ser calculada por esta implementação em menores de 18 anos.');
    if (creatinina <= 0) erros.push('Creatinina deve ser maior que zero.');
    if (dados.sexo !== 'feminino' && dados.sexo !== 'masculino') {
      erros.push('Selecione feminino ou masculino para esta equação.');
    }

    return erros;
  },
};
