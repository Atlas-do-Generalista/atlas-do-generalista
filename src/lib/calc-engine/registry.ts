import type { Calculadora } from './types';
import { imc } from './calculadoras/imc';
import { superficieCorporal } from './calculadoras/superficie-corporal';
import { pesoIdeal } from './calculadoras/peso-ideal';
import { pesoAjustado } from './calculadoras/peso-ajustado';
import { pesoPredito } from './calculadoras/peso-predito';
import { pam } from './calculadoras/pam';
import { pressaoPulso } from './calculadoras/pressao-pulso';
import { shockIndex } from './calculadoras/shock-index';
import { qsofa } from './calculadoras/qsofa';
import { news2 } from './calculadoras/news2';
import { sofa2 } from './calculadoras/sofa-2';
import { apache2 } from './calculadoras/apache2';
import { ckdEpi2021 } from './calculadoras/ckd-epi';
import { cockcroftGault } from './calculadoras/cockcroft-gault';
import { fena } from './calculadoras/fena';
import { feureia } from './calculadoras/feureia';
import { childPugh } from './calculadoras/child-pugh';
import { meld3 } from './calculadoras/meld-3';
import { albi } from './calculadoras/albi';
import { analiseGasometria } from './calculadoras/analise-gasometria';
import { osmolaridadePlasmatica } from './calculadoras/osmolaridade-plasmatica';
import { osmolaridadeEfetiva } from './calculadoras/osmolaridade-efetiva';
import { anionGap } from './calculadoras/anion-gap';
import { anionGapAlbumina } from './calculadoras/anion-gap-albumina';
import { deltaGap } from './calculadoras/delta-gap';
import { sodioCorrigidoGlicemia } from './calculadoras/sodio-corrigido-glicemia';
import { calcioCorrigido } from './calculadoras/calcio-corrigido';
import { deficitAguaLivre } from './calculadoras/deficit-agua-livre';
import { rcri } from './calculadoras/rcri';
import { padua } from './calculadoras/padua';
import { hiss } from './calculadoras/hiss';
import { ciwaAr } from './calculadoras/ciwa-ar';
import { cows } from './calculadoras/cows';

/**
 * Registro central do Motor de Decisão Clínica do Atlas do Generalista.
 *
 * Contém 33 ferramentas clínicas estruturadas:
 * - Antropometria (5)
 * - Gravidade e Deterioração (4)
 * - Cardiovascular e Hemodinâmica (3)
 * - Função Renal (4)
 * - Função Hepática (3)
 * - Gasometria e Ácido-Base (1)
 * - Metabolismo e Hidroeletrolítico (8)
 * - Risco e Profilaxia (2)
 * - Específicas / Neurológicas (3)
 */
export const registry: readonly Calculadora[] = [
  // Antropometria
  imc,
  superficieCorporal,
  pesoIdeal,
  pesoAjustado,
  pesoPredito,

  // Sinais vitais, gravidade geral e hemodinâmica
  news2,
  qsofa,
  sofa2,
  apache2,
  pam,
  pressaoPulso,
  shockIndex,

  // Função renal
  ckdEpi2021,
  cockcroftGault,
  fena,
  feureia,

  // Função hepática
  childPugh,
  meld3,
  albi,

  // Gasometria e Ácido-Base
  analiseGasometria,

  // Laboratório / metabólico / hidroeletrolítico
  osmolaridadePlasmatica,
  osmolaridadeEfetiva,
  anionGap,
  anionGapAlbumina,
  deltaGap,
  sodioCorrigidoGlicemia,
  calcioCorrigido,
  deficitAguaLivre,

  // Risco e profilaxia
  rcri,
  padua,

  // Avaliações neurológicas e específicas
  hiss,
  ciwaAr,
  cows,
];
