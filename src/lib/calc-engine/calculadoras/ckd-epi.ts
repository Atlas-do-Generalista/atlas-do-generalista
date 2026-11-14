import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

/** CKD-EPI 2021 baseada em creatinina, sem coeficiente racial (Inker et al., NEJM 2021). */
export const ckdEpi2021: Calculadora = {
  id: 'ckd-epi-2021',
  nome: 'CKD-EPI 2021 (creatinina)',
  categoria: 'funcao renal',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'renal',
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

    const valorArredondado = Number(valor.toFixed(1));

    let estagioKdigo = '';
    let descricaoEstagio = '';
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';

    if (valorArredondado >= 90) {
      estagioKdigo = 'Estágio G1';
      descricaoEstagio = 'Função renal normal ou elevada';
      nivelGravidade = 'normal';
    } else if (valorArredondado >= 60) {
      estagioKdigo = 'Estágio G2';
      descricaoEstagio = 'Redução leve da TFG';
      nivelGravidade = 'normal';
    } else if (valorArredondado >= 45) {
      estagioKdigo = 'Estágio G3a';
      descricaoEstagio = 'Redução leve a moderada da TFG';
      nivelGravidade = 'atencao';
    } else if (valorArredondado >= 30) {
      estagioKdigo = 'Estágio G3b';
      descricaoEstagio = 'Redução moderada a grave da TFG';
      nivelGravidade = 'alerta';
    } else if (valorArredondado >= 15) {
      estagioKdigo = 'Estágio G4';
      descricaoEstagio = 'Redução grave da TFG';
      nivelGravidade = 'critico';
    } else {
      estagioKdigo = 'Estágio G5';
      descricaoEstagio = 'Falência renal / DRC terminal';
      nivelGravidade = 'critico';
    }

    return {
      valor: valorArredondado,
      unidade: 'mL/min/1,73 m²',
      resumo: `TFGe ${valorArredondado} mL/min/1,73 m² (${estagioKdigo} — ${descricaoEstagio})`,
      nivelGravidade,
      detalhamento: [
        { campo: 'idade', valor: idade, descricao: 'Idade do paciente' },
        { campo: 'sexo', valor: sexo, descricao: 'Sexo biológico utilizado na equação' },
        { campo: 'creatinina', valor: creatinina, descricao: 'Creatinina sérica padronizada (mg/dL)' },
        { campo: 'estagio_kdigo', valor: estagioKdigo, descricao: `Classificação KDIGO 2024: ${descricaoEstagio}` },
      ],
      avisos: [
        'A equação CKD-EPI 2021 fornece a Taxa de Filtração Glomerular estimada (TFGe) NORMALIZADA para a superfície corporal padrão de 1,73 m².',
        'DIFERENÇA CONCEITUAL: Para ajuste posológico de fármacos com estreita faixa terapêutica (ex.: aminoglicosídeos, vancomicina, NOACs), as bulas e diretrizes internacionais recomendam correlacionar com o clearance de creatinina absoluto em mL/min estimado por Cockcroft-Gault.',
        'O diagnóstico formal de Doença Renal Crônica (DRC) exige persistência de TFGe <60 mL/min/1,73 m² ou marcadores de dano renal (ex.: albuminúria) por pelo menos 3 meses.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v >= 90) return `TFGe CKD-EPI 2021: ${v} mL/min/1,73 m² (Estágio G1 — Função renal normal ou elevada).`;
    if (v >= 60) return `TFGe CKD-EPI 2021: ${v} mL/min/1,73 m² (Estágio G2 — Redução leve da TFG).`;
    if (v >= 45) return `TFGe CKD-EPI 2021: ${v} mL/min/1,73 m² (Estágio G3a — Redução leve a moderada da TFG).`;
    if (v >= 30) return `TFGe CKD-EPI 2021: ${v} mL/min/1,73 m² (Estágio G3b — Redução moderada a grave da TFG; requer vigilância de complicações metabólicas).`;
    if (v >= 15) return `TFGe CKD-EPI 2021: ${v} mL/min/1,73 m² (Estágio G4 — Redução grave da TFG; indicação de acompanhamento nefrológico conjunto e preparo de acesso/TRS).`;
    return `TFGe CKD-EPI 2021: ${v} mL/min/1,73 m² (Estágio G5 — Falência renal / DRC terminal; necessidade de terapia renal substitutiva).`;
  },
  populacaoAlvo: 'Adultos (≥18 anos).',
  limitacoes: [
    'Não deve ser utilizada em menores de 18 anos (para pediatria, utiliza-se a equação de Schwartz).',
    'Condições que alteram a geração de creatinina (amputações, sarcopenia severa, dieta hiperproteica, uso de creatina) podem produzir valores enganosos; nesses casos, cistatina C ou clearance urinário são indicados.',
  ],
  referencias: [
    {
      titulo: 'Inker LA et al. New Creatinine- and Cystatin C–Based Equations to Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-1749.',
      url: 'https://doi.org/10.1056/NEJMoa2102953',
    },
    {
      titulo: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024.',
      url: 'https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf',
    },
  ],
  versao: '2021 (sem coeficiente racial)',
  ultimaRevisao: '2026-11-14',
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
