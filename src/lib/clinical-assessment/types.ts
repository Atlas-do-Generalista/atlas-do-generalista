/**
 * Camada 3: Clinical Assessment (Avaliações Clínicas Estruturadas)
 *
 * Esta camada abriga instrumentos semiológicos, avaliações adaptadas
 * e formulários estruturados que NÃO devem ser tratados como meras calculadoras
 * numéricas de escores.
 *
 * Princípios de Design:
 * 1. O Exame do Estado Mental é um instrumento semiológico estruturado com geração
 *    textual determinística, e NÃO uma calculadora com pontuação aritmética.
 * 2. A Pediatria é um contexto clínico próprio, com curvas de percentil/escore-Z,
 *    faixas etárias heterogêneas e instrumentos específicos quando aplicáveis.
 * 3. A derivação do Glasgow pertence a esta camada e fornece a abstração
 *    clínica necessária para alimentar escores de gravidade (APACHE II, SOFA-2).
 */

export interface AvaliacaoClinica<TEntrada = unknown, TSaida = unknown> {
  id: string;
  nome: string;
  dominio: 'neurologico' | 'estado_mental' | 'pediatria' | 'sindromes_especificas';
  versao: string;
  avaliar: (dados: TEntrada) => TSaida;
  validar?: (dados: TEntrada) => readonly string[];
}

export * from './glasgow/types';
export * from './glasgow/derive-glasgow';
