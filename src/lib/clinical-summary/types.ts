/**
 * Camada 4: Clinical Summary (Composição dos Achados e Geração de Textos Clínicos)
 *
 * Responsável pela composição narrativa, geração de evoluções para prontuário
 * e formatação de sumários em linha a partir dos achados clínicos e escores.
 */

export interface ParagrafoClinico {
  categoria: 'demografia' | 'ssvv' | 'neurologico' | 'suporte' | 'renal' | 'hepatico' | 'laboratorio' | 'gasometria' | 'scores' | 'mental';
  titulo: string;
  conteudo: string;
}

export interface ClinicalSummaryOutput {
  linhaResumoScores: string;
  paragrafos: ParagrafoClinico[];
  textoEvolucaoCorrida: string;
  geradoEm: string;
}

export interface ClinicalSummaryComposer<TDados = unknown, TResultados = unknown> {
  id: string;
  nome: string;
  compor: (dados: TDados, resultados: TResultados) => ClinicalSummaryOutput;
}
