/**
 * Tipos centrais do Motor de Decisão Clínica.
 * A interface é deliberadamente ampla: o formulário coleta dados comuns
 * e as calculadoras declaram quais variáveis realmente precisam.
 */

export type Sexo = 'feminino' | 'masculino' | 'outro';
export type TipoAdmissao = 'clinica' | 'pos_operatorio_eletivo' | 'pos_operatorio_nao_eletivo';
export type ValorClinico = number | string | boolean | null | undefined;

export interface ContextoPaciente {
  // Dados gerais
  idade?: number;
  sexo?: Sexo;
  altura?: number;
  peso?: number;
  o2_suplementar?: boolean;
  consciencia?: 'alerta' | 'confusao' | 'rebaixamento';

  // Admissão / saúde crônica
  tipo_admissao?: TipoAdmissao;
  insuficiencia_organica_grave_imunossupressao?: boolean;

  // Sinais vitais
  fc?: number;
  pas?: number;
  pad?: number;
  fr?: number;
  temperatura?: number;
  spo2?: number;

  // Neurológico
  glasgow_ocular?: number;
  glasgow_verbal?: number;
  glasgow_motor?: number;
  glasgow_avaliacao_limitada?: boolean;
  glasgow_pre_sedacao?: number;
  gcs?: number;
  delirium_tratamento?: boolean;

  // Hematologia / bioquímica
  hemacias?: number;
  hemoglobina?: number;
  hematocrito?: number;
  leucocitos?: number;
  plaquetas?: number;
  ureia?: number;
  creatinina?: number;
  glicemia?: number;
  sodio?: number;
  potassio?: number;
  bilirrubina?: number;
  albumina?: number;
  inr?: number;
  ast?: number;
  alt?: number;
  fosfatase_alcalina?: number;
  ggt?: number;

  // Gasometria
  ph?: number;
  pao2?: number;
  paco2?: number;
  hco3?: number;
  excesso_base?: number;
  lactato?: number;
  saturacao_gasometria?: number;
  fio2?: number;
  fio2_percent?: number;
  aado2?: number;

  // Vasoativos / suporte cardiovascular
  vasoativos_em_uso?: boolean;
  vasoativos_continuos_1h?: boolean;
  norepinefrina?: number;
  epinefrina?: number;
  dopamina?: number;
  vasopressina?: number;
  dobutamina?: number;
  milrinona?: number;
  nitroprussiato?: number;
  nitroglicerina?: number;
  sofa2_vasoativos_indisponiveis_limite?: boolean;
  suporte_mecanico_cardiovascular?: boolean;

  // Suporte respiratório
  suporte_ventilatorio_avancado?: boolean;
  suporte_ventilatorio_tipo?: 'nenhum' | 'alto_fluxo' | 'cpap' | 'bipap_niv' | 'ventilacao_mecanica_invasiva' | 'ventilacao_domestica';
  ecmo_respiratorio?: boolean;
  ecmo_cardiovascular?: boolean;
  suporte_ventilatorio_indisponivel_limite?: boolean;

  // Renal
  diurese_ml?: number;
  diurese_horas?: number;
  ira_atual?: boolean;
  terapia_renal_substitutiva?: boolean;
  indicacao_trs_sem_trs?: boolean;
  meld_dialise_semana?: boolean;

  // Hepático / cirrose
  doenca_hepatica_cronica?: boolean;
  cirrose?: boolean;
  ascite?: 'nenhuma' | 'leve_moderada_responsiva' | 'grave_refrataria';
  encefalopatia_hepatica?: 'nenhuma' | 'grau_1_2' | 'grau_3_4';

  // Compatibilidade com versões anteriores do motor
  apache2_ira?: boolean;
  apache2_cronicidade?: 'nenhuma' | 'pos_operatorio_eletivo' | 'grave_nao_eletivo';
  sofa2_delirium_tratamento?: boolean;
  sofa2_suporte_ventilatorio?: boolean;
  sofa2_ecmo?: boolean;
  sofa2_norepinefrina?: number;
  sofa2_epinefrina?: number;
  sofa2_outro_vasoativo?: boolean;
  sofa2_suporte_mecanico_cardiovascular?: boolean;
  sofa2_diurese_ml_hora?: number;
  sofa2_diurese_horas?: number;
  sofa2_trs?: boolean;
  apache2_aado2?: number;
  apache2_ph?: number;
  apache2_sodio?: number;
  apache2_potassio?: number;
  apache2_hematocrito?: number;
  apache2_leucocitos?: number;

  [campo: string]: ValorClinico;
}

export interface DetalheCalculo {
  campo: string;
  valor: ValorClinico;
  pontos?: number;
  descricao?: string;
}

export interface ResultadoCalculadora {
  valor: number;
  unidade?: string;
  resumo?: string;
  detalhamento?: DetalheCalculo[];
  avisos?: string[];
}

export interface Referencia {
  titulo: string;
  url?: string;
  observacao?: string;
}

export interface Calculadora {
  id: string;
  nome: string;
  categoria: string;
  entradas: readonly string[];
  calcular: (dados: ContextoPaciente) => ResultadoCalculadora;
  interpretar?: (resultado: ResultadoCalculadora) => string;
  populacaoAlvo: string;
  limitacoes?: readonly string[];
  referencias: readonly Referencia[];
  versao: string;
  ultimaRevisao: string;
  validar?: (dados: ContextoPaciente) => readonly string[];
  obterEntradasFaltantes?: (dados: ContextoPaciente) => readonly string[];
}

export type ResultadoDisponivel =
  | { calc: Calculadora; status: 'ok'; resultado: ResultadoCalculadora }
  | { calc: Calculadora; status: 'incompleto'; faltando: string[] }
  | { calc: Calculadora; status: 'erro'; erro: string };
