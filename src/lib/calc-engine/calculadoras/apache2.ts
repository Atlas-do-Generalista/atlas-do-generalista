import type {
  Calculadora,
  ContextoPaciente,
  DetalheCalculo,
  ResultadoCalculadora,
} from '../types';

function pontuarTemperatura(t: number): number {
  if (t >= 41) return 4;
  if (t >= 39) return 3;
  if (t >= 38.5) return 1;
  if (t >= 36) return 0;
  if (t >= 34) return 1;
  if (t >= 32) return 2;
  if (t >= 30) return 3;
  return 4;
}

function pontuarPAM(map: number): number {
  if (map >= 160) return 4;
  if (map >= 130) return 3;
  if (map >= 110) return 2;
  if (map >= 70) return 0;
  if (map >= 50) return 2;
  return 4;
}

function pontuarFC(fc: number): number {
  if (fc >= 180) return 4;
  if (fc >= 140) return 3;
  if (fc >= 110) return 2;
  if (fc >= 70) return 0;
  if (fc >= 55) return 2;
  if (fc >= 40) return 3;
  return 4;
}

function pontuarFR(fr: number): number {
  if (fr >= 50) return 4;
  if (fr >= 35) return 3;
  if (fr >= 25) return 1;
  if (fr >= 12) return 0;
  if (fr >= 10) return 1;
  if (fr >= 6) return 2;
  return 4;
}

function pontuarOxigenacao(dados: ContextoPaciente): { pontos: number; descricao: string; valor: number } {
  const fio2 = dados.fio2 as number;

  if (fio2 >= 0.5) {
    const aa = dados.aado2 as number;
    // Tabela 1 de Knaus et al., 1985: A-aDO2 >= 500 (4 pts), 350–499 (3 pts), 200–349 (2 pts), < 200 (0 pts)
    if (aa >= 500) return { pontos: 4, descricao: 'Gradiente A–aDO₂ ≥500 mmHg', valor: aa };
    if (aa >= 350) return { pontos: 3, descricao: 'Gradiente A–aDO₂ 350–499 mmHg', valor: aa };
    if (aa >= 200) return { pontos: 2, descricao: 'Gradiente A–aDO₂ 200–349 mmHg', valor: aa };
    return { pontos: 0, descricao: 'Gradiente A–aDO₂ <200 mmHg', valor: aa };
  }

  const pao2 = dados.pao2 as number;
  if (pao2 >= 70) return { pontos: 0, descricao: 'PaO₂ ≥70 mmHg', valor: pao2 };
  if (pao2 >= 61) return { pontos: 1, descricao: 'PaO₂ 61–69 mmHg', valor: pao2 };
  if (pao2 >= 55) return { pontos: 3, descricao: 'PaO₂ 55–60 mmHg', valor: pao2 };
  return { pontos: 4, descricao: 'PaO₂ <55 mmHg', valor: pao2 };
}

function pontuarPH(ph: number): number {
  if (ph >= 7.7) return 4;
  if (ph >= 7.6) return 3;
  if (ph >= 7.5) return 1;
  if (ph >= 7.33) return 0;
  if (ph >= 7.25) return 2;
  if (ph >= 7.15) return 3;
  return 4;
}

/**
 * Pontuação alternativa pelo HCO₃⁻ venoso sérico conforme Knaus 1985 Table 1,
 * utilizada exclusivamente quando não há gasometria arterial (pH indisponível).
 */
function pontuarHCO3(hco3: number): number {
  if (hco3 >= 52) return 4;
  if (hco3 >= 41) return 3;
  if (hco3 >= 32) return 1;
  if (hco3 >= 22) return 0;
  if (hco3 >= 18) return 2;
  if (hco3 >= 15) return 3;
  return 4;
}

function pontuarSodio(na: number): number {
  if (na >= 180) return 4;
  if (na >= 160) return 3;
  if (na >= 155) return 2;
  if (na >= 150) return 1;
  if (na >= 130) return 0;
  if (na >= 120) return 2;
  if (na >= 111) return 3;
  return 4;
}

function pontuarPotassio(k: number): number {
  if (k >= 7) return 4;
  if (k >= 6) return 3;
  if (k >= 5.5) return 1;
  if (k >= 3.5) return 0;
  if (k >= 3) return 1;
  if (k >= 2.5) return 2;
  return 4;
}

function pontuarCreatinina(creat: number, ira: boolean): number {
  let pontos = 0;
  if (creat >= 3.5) pontos = 4;
  else if (creat >= 2.0) pontos = 3;
  else if (creat >= 1.5) pontos = 2;
  else if (creat < 0.6) pontos = 2;
  return ira ? pontos * 2 : pontos;
}

function pontuarHematocrito(ht: number): number {
  if (ht >= 60) return 4;
  if (ht >= 50) return 2;
  if (ht >= 46) return 1;
  if (ht >= 30) return 0;
  if (ht >= 20) return 2;
  return 4;
}

function pontuarLeucocitos(wbc: number): number {
  if (wbc >= 40) return 4;
  if (wbc >= 15) return 1;
  if (wbc >= 3) return 0;
  if (wbc >= 1) return 2;
  return 4;
}

function pontuarIdade(idade: number): number {
  if (idade >= 75) return 6;
  if (idade >= 65) return 5;
  if (idade >= 55) return 3;
  if (idade >= 45) return 2;
  return 0;
}

function pontosSaudeCronica(dados: ContextoPaciente): number {
  if (!dados.insuficiencia_organica_grave_imunossupressao) return 0;
  return dados.tipo_admissao === 'pos_operatorio_eletivo' ? 2 : 5;
}

export const apache2: Calculadora = {
  id: 'apache-ii',
  nome: 'APACHE II',
  categoria: 'gravidade',
  tipoMetrica: 'escore',
  dominioClinico: 'gravidade',
  entradas: [
    'idade',
    'pas',
    'pad',
    'temperatura',
    'fc',
    'fr',
    'fio2',
    'sodio',
    'potassio',
    'creatinina',
    'hematocrito',
    'leucocitos',
    'gcs',
    'tipo_admissao',
    'insuficiencia_organica_grave_imunossupressao',
  ],
  obterEntradasFaltantes: (dados) => {
    const base = [
      'idade',
      'pas',
      'pad',
      'temperatura',
      'fc',
      'fr',
      'fio2',
      'sodio',
      'potassio',
      'creatinina',
      'hematocrito',
      'leucocitos',
      'gcs',
      'tipo_admissao',
      'insuficiencia_organica_grave_imunossupressao',
    ];

    const faltando = base.filter(
      (campo) => dados[campo] === null || dados[campo] === undefined || dados[campo] === '',
    );

    // Knaus 1985: exige pH arterial; se ausente, aceita HCO3 venoso
    const temPh = dados.ph !== null && dados.ph !== undefined && dados.ph !== '';
    const temHco3 = dados.hco3 !== null && dados.hco3 !== undefined && dados.hco3 !== '';
    if (!temPh && !temHco3) {
      faltando.push('ph ou hco3');
    }

    if (typeof dados.fio2 === 'number') {
      const campoO2 = dados.fio2 >= 0.5 ? 'aado2' : 'pao2';
      const oxValue = (dados as Record<string, unknown>)[campoO2];
      if (oxValue === null || oxValue === undefined || oxValue === '') {
        faltando.push(campoO2);
      }
    }

    return faltando;
  },
  calcular: (dados): ResultadoCalculadora => {
    const map = ((dados.pas as number) + 2 * (dados.pad as number)) / 3;
    const ox = pontuarOxigenacao(dados);
    const ira = Boolean(dados.ira_atual);

    // Determina equilíbrio ácido-base: prefere pH arterial; utiliza HCO3 caso pH não esteja disponível
    let acidoBaseDetalhe: DetalheCalculo;
    if (typeof dados.ph === 'number' && Number.isFinite(dados.ph)) {
      acidoBaseDetalhe = {
        campo: 'ph',
        valor: dados.ph,
        pontos: pontuarPH(dados.ph),
        descricao: 'pH arterial',
      };
    } else if (typeof dados.hco3 === 'number' && Number.isFinite(dados.hco3)) {
      acidoBaseDetalhe = {
        campo: 'hco3',
        valor: dados.hco3,
        pontos: pontuarHCO3(dados.hco3),
        descricao: 'HCO₃⁻ sérico venoso (pH arterial indisponível)',
      };
    } else {
      throw new Error('APACHE II requer pH arterial ou HCO₃⁻ sérico.');
    }

    // Exatamente as 12 variáveis fisiológicas clássicas do APACHE II (Knaus 1985) + Idade + Saúde Crônica
    // Glicemia NÃO faz parte do escore e não pode pontuar
    const detalhes: DetalheCalculo[] = [
      { campo: 'temperatura', valor: dados.temperatura, pontos: pontuarTemperatura(dados.temperatura as number), descricao: 'Temperatura' },
      { campo: 'map', valor: Number(map.toFixed(1)), pontos: pontuarPAM(map), descricao: 'Pressão arterial média' },
      { campo: 'fc', valor: dados.fc, pontos: pontuarFC(dados.fc as number), descricao: 'Frequência cardíaca' },
      { campo: 'fr', valor: dados.fr, pontos: pontuarFR(dados.fr as number), descricao: 'Frequência respiratória' },
      { campo: 'oxigenacao', valor: ox.valor, pontos: ox.pontos, descricao: ox.descricao },
      acidoBaseDetalhe,
      { campo: 'sodio', valor: dados.sodio, pontos: pontuarSodio(dados.sodio as number), descricao: 'Sódio sérico' },
      { campo: 'potassio', valor: dados.potassio, pontos: pontuarPotassio(dados.potassio as number), descricao: 'Potássio sérico' },
      { campo: 'creatinina', valor: dados.creatinina, pontos: pontuarCreatinina(dados.creatinina as number, ira), descricao: `Creatinina${ira ? ' com IRA (pontos dobrados)' : ''}` },
      { campo: 'hematocrito', valor: dados.hematocrito, pontos: pontuarHematocrito(dados.hematocrito as number), descricao: 'Hematócrito' },
      { campo: 'leucocitos', valor: dados.leucocitos, pontos: pontuarLeucocitos(dados.leucocitos as number), descricao: 'Leucócitos (×10³/µL)' },
      { campo: 'gcs', valor: dados.gcs, pontos: 15 - (dados.gcs as number), descricao: 'GCS (15 − GCS)' },
      { campo: 'idade', valor: dados.idade, pontos: pontuarIdade(dados.idade as number), descricao: 'Idade' },
      { campo: 'cronico', valor: dados.insuficiencia_organica_grave_imunossupressao, pontos: pontosSaudeCronica(dados), descricao: 'Saúde crônica grave / imunossupressão + tipo de admissão' },
    ];

    const avisos: string[] = [
      'APACHE II clássico de Knaus et al. (1985) calculado com as 12 variáveis fisiológicas, idade e comorbidade crônica.',
      'A parte de saúde crônica acrescenta 2 pontos em pós-operatório eletivo ou 5 pontos em não eletivo quando há insuficiência orgânica grave/imunossupressão.',
    ];

    if (!dados.ph && dados.hco3) {
      avisos.push('O equilíbrio ácido-base foi pontuado utilizando HCO₃⁻ sérico venoso em substituição ao pH arterial ausente, conforme Knaus 1985.');
    }

    const valor = detalhes.reduce((t, i) => t + (i.pontos ?? 0), 0);
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    let mortalidadeAprox = '';

    if (valor >= 35) {
      nivelGravidade = 'critico';
      mortalidadeAprox = 'Mortalidade em UTI estimada >85%';
    } else if (valor >= 25) {
      nivelGravidade = 'critico';
      mortalidadeAprox = 'Mortalidade em UTI estimada ~55%';
    } else if (valor >= 15) {
      nivelGravidade = 'alerta';
      mortalidadeAprox = 'Mortalidade em UTI estimada ~25%';
    } else if (valor >= 10) {
      nivelGravidade = 'atencao';
      mortalidadeAprox = 'Mortalidade em UTI estimada ~15%';
    } else {
      nivelGravidade = 'normal';
      mortalidadeAprox = 'Mortalidade em UTI estimada <10%';
    }

    return {
      valor,
      unidade: 'pontos',
      resumo: `APACHE II ${valor} pontos (${mortalidadeAprox})`,
      nivelGravidade,
      detalhamento: detalhes,
      avisos,
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v >= 35) return `APACHE II: ${v} pontos (Gravidade extrema — mortalidade estimada em UTI >85%; suporte intensivo invasivo e monitorização contínua).`;
    if (v >= 25) return `APACHE II: ${v} pontos (Gravidade severa — mortalidade estimada em UTI de aproximadamente 55%).`;
    if (v >= 15) return `APACHE II: ${v} pontos (Gravidade moderada a alta — mortalidade estimada em UTI de aproximadamente 25%).`;
    if (v >= 10) return `APACHE II: ${v} pontos (Gravidade moderada — mortalidade estimada em UTI de aproximadamente 15%).`;
    return `APACHE II: ${v} pontos (Baixa gravidade fisiológica — mortalidade estimada em UTI <10%).`;
  },
  populacaoAlvo: 'Adultos em terapia intensiva.',
  limitacoes: [
    'Não é APACHE IV/IVa.',
    'A ferramenta não reconstrói automaticamente os piores valores das primeiras 24 horas.',
    'A glicemia do paciente não faz parte do escore original e é deliberadamente desconsiderada no cálculo.',
  ],
  referencias: [
    {
      titulo: 'Knaus WA, Draper EA, Wagner DP, Zimmerman JE. APACHE II: a severity of disease classification system. Crit Care Med. 1985;13(10):818-829.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/3928249/',
    },
  ],
  versao: 'Knaus 1985 canônico',
  ultimaRevisao: '2026-10-29',
  validar: (dados) => {
    const erros: string[] = [];
    if (typeof dados.gcs !== 'number' || dados.gcs < 3 || dados.gcs > 15) erros.push('GCS deve estar entre 3 e 15.');
    if (typeof dados.fio2 !== 'number' || dados.fio2 < 0.21 || dados.fio2 > 1) erros.push('FiO₂ deve estar entre 0,21 e 1,00.');
    if (typeof dados.temperatura !== 'number' || dados.temperatura < 25 || dados.temperatura > 45) erros.push('Temperatura fora do intervalo plausível.');
    if (typeof dados.hematocrito !== 'number' || dados.hematocrito < 0) erros.push('Hematócrito não pode ser negativo.');
    if (typeof dados.leucocitos !== 'number' || dados.leucocitos < 0) erros.push('Leucócitos não podem ser negativos.');
    if (typeof dados.creatinina !== 'number' || dados.creatinina <= 0) erros.push('Creatinina deve ser maior que zero.');
    if (typeof dados.sodio !== 'number' || dados.sodio <= 0) erros.push('Sódio deve ser maior que zero.');
    if (typeof dados.potassio !== 'number' || dados.potassio <= 0) erros.push('Potássio deve ser maior que zero.');
    if (typeof dados.ph === 'number' && (dados.ph < 6.5 || dados.ph > 8.0)) erros.push('pH arterial fora da faixa biológica plausível (6,50 a 8,00).');
    if (typeof dados.hco3 === 'number' && (dados.hco3 < 1 || dados.hco3 > 80)) erros.push('HCO₃⁻ fora da faixa aceitável (1 a 80 mEq/L).');
    return erros;
  },
};
