import type { Calculadora } from './types';
import { imc } from './calculadoras/imc';
import { superficieCorporal } from './calculadoras/superficie-corporal';
import { pesoIdeal } from './calculadoras/peso-ideal';
import { pesoAjustado } from './calculadoras/peso-ajustado';
import { pam } from './calculadoras/pam';
import { shockIndex } from './calculadoras/shock-index';
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
import { osmolaridadePlasmatica } from './calculadoras/osmolaridade-plasmatica';
import { osmolaridadeEfetiva } from './calculadoras/osmolaridade-efetiva';
import { anionGap } from './calculadoras/anion-gap';
import { anionGapAlbumina } from './calculadoras/anion-gap-albumina';
import { deltaGap } from './calculadoras/delta-gap';
import { sodioCorrigidoGlicemia } from './calculadoras/sodio-corrigido-glicemia';
import { rcri } from './calculadoras/rcri';
import { padua } from './calculadoras/padua';
import { hiss } from './calculadoras/hiss';
import { ciwaAr } from './calculadoras/ciwa-ar';
import { cows } from './calculadoras/cows';

/**
 * Registro central do Motor de Decisão Clínica.
 *
 * A ordem também define a ordem de apresentação no módulo Condição atual.
 */
export const registry: readonly Calculadora[] = [
  // Antropometria
  imc,
  superficieCorporal,
  pesoIdeal,
  pesoAjustado,

  // Sinais vitais e gravidade geral
  pam,
  shockIndex,
  news2,
  sofa2,
  apache2,

  // Função renal
  ckdEpi2021,
  cockcroftGault,
  fena,
  feureia,

  // Função hepática
  childPugh,
  meld3,
  albi,

  // Laboratório / metabólico
  osmolaridadePlasmatica,
  osmolaridadeEfetiva,
  anionGap,
  anionGapAlbumina,
  deltaGap,
  sodioCorrigidoGlicemia,

  // Risco e profilaxia
  rcri,
  padua,

  // Avaliações neurológicas e específicas
  hiss,
  ciwaAr,
  cows,
];
