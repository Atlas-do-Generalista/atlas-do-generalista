import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const deficitAguaLivre: Calculadora = {
  id: 'deficit-agua-livre',
  nome: 'Déficit de Água Livre',
  categoria: 'laboratorio e metabolico',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'metabolismo',
  entradas: ['sodio', 'peso', 'sexo'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const na = dados.sodio as number;
    const peso = dados.peso as number;
    const sexo = dados.sexo;
    const idade = typeof dados.idade === 'number' ? dados.idade : 40;

    // Fração de Água Corporal Total (ACT):
    // Homem adulto: 0.6; Homem idoso (>65): 0.5
    // Mulher adulta: 0.5; Mulher idosa (>65): 0.45
    let fatorAct = 0.6;
    if (sexo === 'masculino') {
      fatorAct = idade >= 65 ? 0.5 : 0.6;
    } else {
      fatorAct = idade >= 65 ? 0.45 : 0.5;
    }

    const act = Number((fatorAct * peso).toFixed(1));
    const deficit = Number((act * ((na / 140) - 1)).toFixed(1));
    const valor = deficit > 0 ? deficit : 0;

    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    if (na >= 160) nivelGravidade = 'critico';
    else if (na > 150) nivelGravidade = 'alerta';
    else if (na > 145) nivelGravidade = 'atencao';

    return {
      valor,
      unidade: 'litros',
      resumo: `Déficit de Água Livre: ${valor} L (Na ${na} mEq/L)`,
      nivelGravidade,
      detalhamento: [
        { campo: 'sodio', valor: na, descricao: 'Sódio sérico atual' },
        { campo: 'peso', valor: peso, descricao: 'Peso corporal' },
        { campo: 'act', valor: act, descricao: `Água corporal total estimada (${fatorAct * 100}% do peso)` },
        { campo: 'deficit', valor, descricao: 'Déficit de água livre = ACT × ([Na/140] − 1)' },
      ],
      avisos: [
        'O déficit de água livre é um cálculo orientador para a reposição de volume em hipernatremia por perda de água pura (ou desidratação hipotônica).',
        'ATENÇÃO CLÍNICA: A correção do sódio sérico não deve exceder 8 a 10 mEq/L em 24 horas para evitar edema cerebral agudo e desmielinização. Some as perdas insensíveis em curso ao volume calculado.',
      ],
    };
  },
  interpretar: (resultado) => {
    const v = Number(resultado.valor);
    if (v <= 0) {
      return `Déficit de água livre: 0 L. Paciente sem hipernatremia (sódio sérico ≤140 mEq/L).`;
    }
    return `Déficit de água livre estimado: ${v} litros de água pura. Corrija gradualmente (máximo 8 a 10 mEq/L de redução do sódio em 24 horas) para prevenir edema cerebral.`;
  },
  populacaoAlvo: 'Adultos com hipernatremia (Na > 145 mEq/L).',
  referencias: [
    {
      titulo: 'Adrogué HJ, Madias NE. Hypernatremia. N Engl J Med. 2000;342(20):1493-1499.',
      url: 'https://doi.org/10.1056/NEJM200005183422006',
    },
  ],
  versao: 'Adrogué-Madias 2000',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.sodio !== 'number' || d.sodio <= 0) erros.push('Sódio deve ser maior que zero.');
    if (typeof d.peso !== 'number' || d.peso <= 0) erros.push('Peso deve ser maior que zero.');
    if (d.sexo !== 'feminino' && d.sexo !== 'masculino') erros.push('Selecione feminino ou masculino.');
    return erros;
  },
};
