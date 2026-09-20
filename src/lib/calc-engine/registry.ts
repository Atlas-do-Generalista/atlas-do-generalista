import type { Calculadora } from './types';

import { news2 } from './calculadoras/news2';
import { pam } from './calculadoras/pam';
import { shockIndex } from './calculadoras/shock-index';
import { ckdEpi2021 } from './calculadoras/ckd-epi';
import { cockcroftGault } from './calculadoras/cockcroft-gault';
import { apache2 } from './calculadoras/apache2';
import { sofa2 } from './calculadoras/sofa-2';
import { childPugh } from './calculadoras/child-pugh';
import { meld3 } from './calculadoras/meld-3';
import { albi } from './calculadoras/albi';

/** Registro central do Motor de Decisão Clínica. */
export const registry: readonly Calculadora[] = [
  pam,
  shockIndex,
  news2,
  ckdEpi2021,
  cockcroftGault,
  apache2,
  sofa2,
  childPugh,
  meld3,
  albi,
];
