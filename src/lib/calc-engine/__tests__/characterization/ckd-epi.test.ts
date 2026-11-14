import { describe, it, expect } from 'vitest';
import { ckdEpi2021 } from '../../calculadoras/ckd-epi';
import type { ContextoPaciente } from '../../types';

describe('Caracterização: CKD-EPI 2021 (sem coeficiente racial)', () => {
  it('deve calcular TFGe esperada para homem de 50 anos com creatinina de 0,9 mg/dL (104,0 mL/min/1,73 m²)', () => {
    const homem50: ContextoPaciente = {
      idade: 50,
      sexo: 'masculino',
      creatinina: 0.9,
    };

    const resultado = ckdEpi2021.calcular(homem50);
    expect(resultado.valor).toBe(104.0);
    expect(resultado.unidade).toBe('mL/min/1,73 m²');
  });

  it('deve calcular TFGe esperada para mulher de 60 anos com creatinina de 1,4 mg/dL (43,1 mL/min/1,73 m²)', () => {
    const mulher60: ContextoPaciente = {
      idade: 60,
      sexo: 'feminino',
      creatinina: 1.4,
    };

    const resultado = ckdEpi2021.calcular(mulher60);
    expect(resultado.valor).toBe(43.1);
  });

  it('deve rejeitar idade < 18 anos na função validar (especificidade para adultos)', () => {
    const pacientePediatrico: ContextoPaciente = {
      idade: 15,
      sexo: 'feminino',
      creatinina: 0.8,
    };

    const erros = ckdEpi2021.validar!(pacientePediatrico);
    expect(erros.some((e) => e.includes('menores de 18 anos'))).toBe(true);
  });

  it('deve exigir definição binária de sexo biológico feminino ou masculino pela equação', () => {
    const semSexo: ContextoPaciente = {
      idade: 45,
      sexo: 'outro',
      creatinina: 1.0,
    };

    const erros = ckdEpi2021.validar!(semSexo);
    expect(erros.some((e) => e.includes('feminino ou masculino'))).toBe(true);
  });
});
