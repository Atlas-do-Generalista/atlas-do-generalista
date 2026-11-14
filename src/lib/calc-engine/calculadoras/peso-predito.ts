import type { Calculadora, ContextoPaciente, ResultadoCalculadora } from '../types';

export const pesoPredito: Calculadora = {
  id: 'peso-predito',
  nome: 'Peso Predito (PBW / ARDSNet)',
  categoria: 'antropometria',
  tipoMetrica: 'medida_calculada',
  dominioClinico: 'antropometria',
  entradas: ['altura', 'sexo'],
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const altura = dados.altura as number;
    const sexo = dados.sexo;
    const diff = altura - 152.4;
    const base = sexo === 'masculino' ? 50 : 45.5;
    const pbw = base + 0.91 * diff;
    const valor = Number(pbw.toFixed(1));
    const vt4 = Number((valor * 4).toFixed(0));
    const vt6 = Number((valor * 6).toFixed(0));
    const vt8 = Number((valor * 8).toFixed(0));

    return {
      valor,
      unidade: 'kg',
      resumo: `Peso Predito ${valor} kg (Vt alvo 6 mL/kg = ${vt6} mL)`,
      detalhamento: [
        { campo: 'pbw', valor, descricao: 'Peso corporal predito (PBW)' },
        { campo: 'vt_4', valor: vt4, descricao: 'Volume corrente ultraprotetor (4 mL/kg)' },
        { campo: 'vt_6', valor: vt6, descricao: 'Volume corrente protetor padrão (6 mL/kg — ARDSNet)' },
        { campo: 'vt_8', valor: vt8, descricao: 'Volume corrente limite superior seguro (8 mL/kg)' },
      ],
      avisos: [
        'O peso predito é a referência mandatória para ventilação mecânica protetora (ARDSNet), prevenindo volutrauma e barotrauma.',
        'O volume corrente NUNCA deve ser prescrito com base no peso real em pacientes com sobrepeso ou obesidade, pois os pulmões não crescem proporcionalmente ao tecido adiposo.',
      ],
    };
  },
  interpretar: (resultado) => {
    const pbw = Number(resultado.valor);
    const vt6 = Number((pbw * 6).toFixed(0));
    return `Peso Predito (PBW): ${pbw} kg. Para ventilação mecânica protetora, programe 6 mL/kg (${vt6} mL de volume corrente). Faixa protetora recomendada: 4 a 8 mL/kg (${(pbw * 4).toFixed(0)} a ${(pbw * 8).toFixed(0)} mL).`;
  },
  populacaoAlvo: 'Adultos sob suporte ventilatório invasivo ou não invasivo.',
  referencias: [
    {
      titulo: 'The Acute Respiratory Distress Syndrome Network. Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. N Engl J Med. 2000;342(18):1301-1308.',
      url: 'https://doi.org/10.1056/NEJM200005043421801',
    },
  ],
  versao: 'ARDSNet 2000',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const erros: string[] = [];
    if (d.sexo !== 'feminino' && d.sexo !== 'masculino') erros.push('Selecione feminino ou masculino.');
    if (typeof d.altura !== 'number' || d.altura <= 0) erros.push('Altura deve ser maior que zero.');
    return erros;
  },
};
