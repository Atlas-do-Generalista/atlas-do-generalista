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
    if (aa >= 500) return { pontos: 3, descricao: 'Gradiente A–aDO₂ ≥500 mmHg', valor: aa };
    if (aa >= 350) return { pontos: 2, descricao: 'Gradiente A–aDO₂ 350–499 mmHg', valor: aa };
    if (aa >= 200) return { pontos: 1, descricao: 'Gradiente A–aDO₂ 200–349 mmHg', valor: aa };
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

function pontuarGlicemia(glicemia: number): number {
  if (glicemia >= 200) {
    if (glicemia >= 350) return 4;
    if (glicemia >= 300) return 3;
    if (glicemia >= 200) return 2;
  }
  if (glicemia >= 180) return 1;
  if (glicemia >= 70) return 0;
  if (glicemia >= 40) return 1;
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
  entradas: [
    'idade', 'pas', 'pad', 'temperatura', 'fc', 'fr', 'fio2', 'ph',
    'sodio', 'potassio', 'creatinina', 'glicemia', 'hematocrito',
    'leucocitos', 'gcs', 'tipo_admissao',
    'insuficiencia_organica_grave_imunossupressao',
  ],
  obterEntradasFaltantes: (dados) => {
    const base = [
      'idade', 'pas', 'pad', 'temperatura', 'fc', 'fr', 'fio2', 'ph',
      'sodio', 'potassio', 'creatinina', 'glicemia', 'hematocrito',
      'leucocitos', 'gcs', 'tipo_admissao',
      'insuficiencia_organica_grave_imunossupressao',
    ];

    const faltando = base.filter((campo) => dados[campo] === null || dados[campo] === undefined || dados[campo] === '');

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

    const detalhes: DetalheCalculo[] = [
      { campo: 'temperatura', valor: dados.temperatura, pontos: pontuarTemperatura(dados.temperatura as number), descricao: 'Temperatura' },
      { campo: 'map', valor: Number(map.toFixed(1)), pontos: pontuarPAM(map), descricao: 'Pressão arterial média' },
      { campo: 'fc', valor: dados.fc, pontos: pontuarFC(dados.fc as number), descricao: 'Frequência cardíaca' },
      { campo: 'fr', valor: dados.fr, pontos: pontuarFR(dados.fr as number), descricao: 'Frequência respiratória' },
      { campo: 'oxigenacao', valor: ox.valor, pontos: ox.pontos, descricao: ox.descricao },
      { campo: 'ph', valor: dados.ph, pontos: pontuarPH(dados.ph as number), descricao: 'pH arterial' },
      { campo: 'sodio', valor: dados.sodio, pontos: pontuarSodio(dados.sodio as number), descricao: 'Sódio sérico' },
      { campo: 'potassio', valor: dados.potassio, pontos: pontuarPotassio(dados.potassio as number), descricao: 'Potássio sérico' },
      { campo: 'creatinina', valor: dados.creatinina, pontos: pontuarCreatinina(dados.creatinina as number, ira), descricao: `Creatinina${ira ? ' com IRA (pontos dobrados)' : ''}` },
      { campo: 'glicemia', valor: dados.glicemia, pontos: pontuarGlicemia(dados.glicemia as number), descricao: 'Glicemia' },
      { campo: 'hematocrito', valor: dados.hematocrito, pontos: pontuarHematocrito(dados.hematocrito as number), descricao: 'Hematócrito' },
      { campo: 'leucocitos', valor: dados.leucocitos, pontos: pontuarLeucocitos(dados.leucocitos as number), descricao: 'Leucócitos (×10³/µL)' },
      { campo: 'gcs', valor: dados.gcs, pontos: 15 - (dados.gcs as number), descricao: 'GCS (15 − GCS)' },
      { campo: 'idade', valor: dados.idade, pontos: pontuarIdade(dados.idade as number), descricao: 'Idade' },
      { campo: 'cronico', valor: dados.insuficiencia_organica_grave_imunossupressao, pontos: pontosSaudeCronica(dados), descricao: 'Saúde crônica grave / imunossupressão + tipo de admissão' },
    ];

    return {
      valor: detalhes.reduce((t, i) => t + (i.pontos ?? 0), 0),
      unidade: 'pontos',
      detalhamento: detalhes,
      avisos: [
        'APACHE II é calculado com os piores valores fisiológicos das primeiras 24 horas de UTI; esta ferramenta calcula o conjunto de valores atualmente informado.',
        'A parte de saúde crônica acrescenta 2 pontos em pós-operatório eletivo ou 5 pontos em não eletivo quando há insuficiência orgânica grave/imunossupressão, conforme o formulário clássico.',
      ],
    };
  },
  interpretar: (resultado) => `APACHE II: ${resultado.valor} pontos. Use-o como escore de gravidade; não converta diretamente o escore em probabilidade individual de óbito sem o modelo prognóstico completo.`,
  populacaoAlvo: 'Adultos em terapia intensiva.',
  limitacoes: [
    'Não é APACHE IV/IVa.',
    'A ferramenta não reconstrói automaticamente os piores valores das primeiras 24 horas.',
  ],
  referencias: [
    { titulo: 'Knaus WA et al. APACHE II: a severity of disease classification system. Crit Care Med. 1985.', url: 'https://pubmed.ncbi.nlm.nih.gov/3928249/' },
  ],
  versao: 'II',
  ultimaRevisao: '2026-09-19',
  validar: (dados) => {
    const erros: string[] = [];
    if (typeof dados.gcs !== 'number' || dados.gcs < 3 || dados.gcs > 15) erros.push('GCS deve estar entre 3 e 15.');
    if (typeof dados.fio2 !== 'number' || dados.fio2 < 0.21 || dados.fio2 > 1) erros.push('FiO₂ deve estar entre 0,21 e 1,00.');
    if (typeof dados.temperatura !== 'number' || dados.temperatura < 25 || dados.temperatura > 45) erros.push('Temperatura fora do intervalo plausível.');
    if (typeof dados.hematocrito !== 'number' || dados.hematocrito < 0) erros.push('Hematócrito não pode ser negativo.');
    if (typeof dados.leucocitos !== 'number' || dados.leucocitos < 0) erros.push('Leucócitos não podem ser negativos.');
    return erros;
  },
};
