import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const imc: Calculadora = {
  id: 'imc',
  nome: 'Índice de massa corporal (IMC)',
  categoria: 'antropometria',
  tipoMetrica: 'indice',
  dominioClinico: 'antropometria',
  entradas: ['peso', 'altura'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const peso = dados.peso as number;
    const altura = dados.altura as number;
    const alturaM = altura / 100;
    const valor = peso / (alturaM * alturaM);
    const valorArredondado = Number(valor.toFixed(1));

    let classificacao = 'Eutrofia';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';

    if (valorArredondado < 18.5) {
      classificacao = 'Baixo peso';
      nivelGravidade = 'atencao';
    } else if (valorArredondado < 25.0) {
      classificacao = 'Eutrofia';
      nivelGravidade = 'normal';
    } else if (valorArredondado < 30.0) {
      classificacao = 'Sobrepeso';
      nivelGravidade = 'atencao';
    } else if (valorArredondado < 35.0) {
      classificacao = 'Obesidade Grau I';
      nivelGravidade = 'atencao';
    } else if (valorArredondado < 40.0) {
      classificacao = 'Obesidade Grau II (severa)';
      nivelGravidade = 'alerta';
    } else {
      classificacao = 'Obesidade Grau III (mórbida)';
      nivelGravidade = 'critico';
    }

    return {
      valor: valorArredondado,
      unidade: 'kg/m²',
      resumo: `IMC ${valorArredondado} kg/m² (${classificacao})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'peso', valor: peso, descricao: 'Peso atual (kg)' },
        { campo: 'altura', valor: altura, descricao: 'Altura (cm)' },
        { campo: 'classificacao_oms', valor: classificacao, descricao: 'Classificação OMS' },
      ],
      avisos: [
        'A classificação de IMC da OMS foi validada para a população adulta geral; não distingue entre massa muscular, gordura corporal e edema/retenção hídrica.',
        'Em idosos (>65 anos), pontos de corte comumente adotados consideram sobrepeso valores >27 kg/m² e baixo peso <22 kg/m² (critérios Lipschitz/OPAS).',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v < 18.5) return `IMC: ${v} kg/m² (Baixo peso — avaliar risco de desnutrição e sarcopenia).`;
    if (v < 25.0) return `IMC: ${v} kg/m² (Eutrofia / peso saudável para adultos).`;
    if (v < 30.0) return `IMC: ${v} kg/m² (Sobrepeso — orientar hábitos de vida saudáveis e prevenção metabólica).`;
    if (v < 35.0) return `IMC: ${v} kg/m² (Obesidade Grau I — rastrear comorbidades metabólicas e cardiovasculares).`;
    if (v < 40.0) return `IMC: ${v} kg/m² (Obesidade Grau II — obesidade severa; avaliar risco cardiovascular e esteatose hepática).`;
    return `IMC: ${v} kg/m² (Obesidade Grau III — obesidade mórbida; indicação de acompanhamento multiprofissional intensivo).`;
  },
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
