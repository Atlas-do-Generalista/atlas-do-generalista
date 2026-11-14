import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const cockcroftGault: Calculadora = {
  id: 'cockcroft-gault',
  nome: 'Cockcroft-Gault (ClCr)',
  categoria: 'funcao renal',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'renal',
  entradas: ['idade', 'peso', 'sexo', 'creatinina'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const idade = dados.idade as number;
    const peso = dados.peso as number;
    const creatinina = dados.creatinina as number;
    const fatorSexo = dados.sexo === 'feminino' ? 0.85 : 1;

    const valor = ((140 - idade) * peso) / (72 * creatinina) * fatorSexo;
    const valorArredondado = Number(valor.toFixed(1));

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    if (valorArredondado < 15) nivelGravidade = 'critico';
    else if (valorArredondado < 30) nivelGravidade = 'alerta';
    else if (valorArredondado < 50) nivelGravidade = 'atencao';

    return {
      valor: valorArredondado,
      unidade: 'mL/min',
      resumo: `ClCr ${valorArredondado} mL/min (Cockcroft-Gault)`,
      nivelGravidade,
      detalhamento: [
        { campo: 'idade', valor: idade, descricao: 'Idade (anos)' },
        { campo: 'peso', valor: peso, descricao: 'Peso utilizado (kg)' },
        { campo: 'sexo', valor: dados.sexo, descricao: `Sexo utilizado (fator multiplicador: ${fatorSexo})` },
        { campo: 'creatinina', valor: creatinina, descricao: 'Creatinina sérica (mg/dL)' },
      ],
      avisos: [
        'FINALIDADE CLÍNICA PRINCIPAL: O clearance estimado por Cockcroft-Gault é expresso em mL/min absolutos (não normalizado por 1,73 m²), sendo o padrão histórico formalmente validado nas bulas da FDA e ANVISA para ajuste posológico de medicamentos de excreção renal (ex.: vancomicina, aminoglicosídeos, NOACs).',
        'Em pacientes com obesidade (IMC ≥30 kg/m²), o uso do peso real superestima o clearance renal; recomenda-se avaliar o uso do peso ajustado (fator 0,4) conforme o protocolo farmacocinético institucional.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    return `Depuração de creatinina (Cockcroft-Gault): ${v} mL/min. Expressa depuração absoluta não normalizada para 1,73 m², sendo o parâmetro preferencial para ajuste de doses farmacológicas em insuficiência renal.`;
  },
  populacaoAlvo: 'Adultos para os quais se dispõe de idade, peso, sexo e creatinina sérica.',
  limitacoes: [
    'A fórmula original utiliza o peso corporal total; em obesidade e desnutrição grave, a escolha do peso (real vs ideal vs ajustado) altera significativamente o resultado.',
    'Não substitui a TFGe CKD-EPI para fins de estadiamento e diagnóstico de doença renal crônica.',
  ],
  referencias: [
    {
      titulo: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.',
      url: 'https://doi.org/10.1159/000180580',
    },
    {
      titulo: 'FDA Guidance for Industry: Pharmacokinetics in Patients with Impaired Renal Function — Study Design, Data Analysis, and Impact on Dosing',
      url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/pharmacokinetics-patients-impaired-renal-function-study-design-data-analysis-and-impact-dosing',
    },
  ],
  versao: '1976',
  ultimaRevisao: '2026-11-14',
  validar: (dados) => {
    const erros: string[] = [];
    const idade = dados.idade as number;
    const peso = dados.peso as number;
    const creatinina = dados.creatinina as number;

    if (idade <= 0 || idade >= 140) erros.push('Idade fora da faixa aceitável para esta implementação.');
    if (peso <= 0) erros.push('Peso deve ser maior que zero.');
    if (creatinina <= 0) erros.push('Creatinina deve ser maior que zero.');
    if (dados.sexo !== 'feminino' && dados.sexo !== 'masculino') {
      erros.push('Selecione feminino ou masculino para esta fórmula.');
    }

    return erros;
  },
};
