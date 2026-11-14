import type { Calculadora, ContextoPaciente, DetalheCalculo, ResultadoCalculadora } from '../types';

function campoVazio(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

/**
 * Motor Integrado de Análise da Gasometria Arterial e Equilíbrio Ácido-Base.
 *
 * Fundamentado nas diretrizes clínicas clássicas e no Harrison's Principles of Internal Medicine
 * (21ª Ed., Capítulo 58: Acidosis and Alkalosis — Tabelas 58-1 e 58-2).
 *
 * Avalia de forma estruturada:
 * 1. Distúrbio primário (Acidose vs. Alcalose; Metabólica vs. Respiratória vs. Mista)
 * 2. Resposta compensatória esperada (Fórmula de Winter, compensação metabólica e respiratória)
 * 3. Distúrbios mistos (Tabela 58-2: Acidose mista, Alcalose mista, Acidose com AG elevado + Alcalose metabólica, etc.)
 * 4. Ânion Gap e Ânion Gap corrigido pela albumina sérica
 * 5. Delta Gap e Delta Ratio (ΔAG / ΔHCO₃⁻)
 * 6. Oxigenação (PaO₂/FiO₂ e Gradiente Alvéolo-Arterial A–aDO₂)
 * 7. Perfusão tecidual (Lactato sérico)
 */
export const analiseGasometria: Calculadora = {
  id: 'analise-gasometria',
  nome: 'Gasometria e Equilíbrio Ácido-Base',
  categoria: 'gasometria, troca gasosa e equilibrio acido-base',
  tipoMetrica: 'classificacao',
  dominioClinico: 'gasometria',
  entradas: ['ph', 'paco2', 'hco3'],
  obterEntradasFaltantes: (d) => {
    const faltando: string[] = [];
    if (campoVazio(d.ph)) faltando.push('ph');
    if (campoVazio(d.paco2)) faltando.push('paco2');
    if (campoVazio(d.hco3)) faltando.push('hco3');
    return faltando;
  },
  calcular: (dados: ContextoPaciente): ResultadoCalculadora => {
    const ph = dados.ph as number;
    const paco2 = dados.paco2 as number;
    const hco3 = dados.hco3 as number;
    const pao2 = typeof dados.pao2 === 'number' && Number.isFinite(dados.pao2) ? dados.pao2 : undefined;
    const lactato = typeof dados.lactato === 'number' && Number.isFinite(dados.lactato) ? dados.lactato : undefined;
    const na = typeof dados.sodio === 'number' && Number.isFinite(dados.sodio) ? dados.sodio : undefined;
    const cl = typeof dados.cloro === 'number' && Number.isFinite(dados.cloro)
      ? dados.cloro
      : (typeof (dados as Record<string, unknown>).cloreto === 'number' && Number.isFinite((dados as Record<string, unknown>).cloreto)
        ? (dados as Record<string, unknown>).cloreto as number
        : undefined);
    const alb = typeof dados.albumina === 'number' && Number.isFinite(dados.albumina) ? dados.albumina : undefined;

    // Resolução da FiO2 (converte porcentagem 21-100 para decimal se necessário)
    let fio2Decimal: number | undefined;
    if (typeof dados.fio2_percent === 'number' && Number.isFinite(dados.fio2_percent)) {
      fio2Decimal = dados.fio2_percent > 1 ? dados.fio2_percent / 100 : dados.fio2_percent;
    } else if (typeof dados.fio2 === 'number' && Number.isFinite(dados.fio2)) {
      fio2Decimal = dados.fio2 > 1 ? dados.fio2 / 100 : dados.fio2;
    } else if (dados.o2_suplementar === false) {
      fio2Decimal = 0.21;
    }

    const detalhes: DetalheCalculo[] = [
      { campo: 'ph', valor: ph, descricao: `pH arterial (${ph < 7.35 ? 'Acidemia' : ph > 7.45 ? 'Alcalemia' : 'Normal'})` },
      { campo: 'paco2', valor: paco2, descricao: `PaCO₂ (${paco2 < 35 ? 'Hipocapnia' : paco2 > 45 ? 'Hipercapnia' : 'Normal'})` },
      { campo: 'hco3', valor: hco3, descricao: `HCO₃⁻ sérico (${hco3 < 22 ? 'Reduzido' : hco3 > 26 ? 'Elevado' : 'Normal'})` },
    ];

    const avisos: string[] = [];

    // 1. Ânion Gap e correção por albumina
    let anionGap: number | undefined;
    let anionGapCorrigido: number | undefined;
    let deltaAg: number | undefined;
    let deltaHco3: number | undefined;
    let deltaRatio: number | undefined;

    if (na !== undefined && cl !== undefined) {
      anionGap = Number((na - (cl + hco3)).toFixed(1));
      detalhes.push({
        campo: 'anion_gap',
        valor: anionGap,
        descricao: 'Ânion Gap sérico [Na⁺ - (Cl⁻ + HCO₃⁻)]',
      });
      if (alb !== undefined) {
        anionGapCorrigido = Number((anionGap + 2.5 * (4.0 - alb)).toFixed(1));
        detalhes.push({
          campo: 'anion_gap_albumina',
          valor: anionGapCorrigido,
          descricao: `Ânion Gap corrigido p/ albumina (${alb.toFixed(1)} g/dL)`,
        });
      } else {
        anionGapCorrigido = anionGap;
        avisos.push('Ânion gap não corrigido por albumina. Em pacientes hipoalbuminêmicos, cada 1 g/dL de queda na albumina reduz o AG basal em ~2,5 mEq/L.');
      }

      deltaAg = Number((anionGapCorrigido - 12).toFixed(1));
      deltaHco3 = Number((24 - hco3).toFixed(1));
      if (deltaHco3 !== 0) {
        deltaRatio = Number((deltaAg / deltaHco3).toFixed(2));
      }
    }

    // 2. Análise do Distúrbio Ácido-Base Primário e Compensação (Harrison Tabela 58-1 e 58-2)
    let diagnosticoAcidoBase = '';
    let statusCompensacao = '';
    let distubioMistoDetectado = '';

    // CASO 1: ACIDEMIA (pH < 7.35)
    if (ph < 7.35) {
      // 1.1 Acidose mista pura (ambos alterados para acidose)
      if (hco3 < 22 && paco2 > 45) {
        diagnosticoAcidoBase = 'Acidose mista (metabólica e respiratória)';
        statusCompensacao = 'Sem compensação; ambos os componentes respiratório e metabólico contribuem para a acidemia grave';
      }
      // 1.2 Acidose metabólica primária
      else if (hco3 < 22) {
        const agElevado = anionGapCorrigido !== undefined && anionGapCorrigido > 12;
        diagnosticoAcidoBase = agElevado
          ? `Acidose metabólica com ânion gap elevado (AGc ${anionGapCorrigido} mEq/L)`
          : 'Acidose metabólica hiperclorêmica (ânion gap normal)';

        // Fórmula de Winter: PaCO2 = (1.5 * HCO3) + 8 +- 2
        const paco2Esperado = 1.5 * hco3 + 8;
        const paco2Min = Number((paco2Esperado - 2).toFixed(1));
        const paco2Max = Number((paco2Esperado + 2).toFixed(1));

        detalhes.push({
          campo: 'paco2_esperado',
          valor: Number(paco2Esperado.toFixed(1)),
          descricao: `PaCO₂ esperada pela Fórmula de Winter (${paco2Min} a ${paco2Max} mmHg)`,
        });
        detalhes.push({
          campo: 'winter_formula',
          valor: `${paco2Min} a ${paco2Max} mmHg`,
          descricao: `Faixa de compensação esperada de Winter (1,5 × HCO₃⁻ + 8 ± 2)`,
        });

        if (paco2 >= paco2Min && paco2 <= paco2Max) {
          statusCompensacao = `Em compensação respiratória adequada (PaCO₂ esperado: ${paco2Min}–${paco2Max} mmHg; medido: ${paco2} mmHg)`;
        } else if (paco2 > paco2Max) {
          statusCompensacao = `Com acidose respiratória associada (PaCO₂ medido ${paco2} mmHg acima do esperado por Winter: ${paco2Min}–${paco2Max} mmHg — hipoventilação/fadiga respiratória)`;
          distubioMistoDetectado = 'Acidose metabólica + acidose respiratória (Tabela 58-2)';
        } else {
          statusCompensacao = `Com alcalose respiratória associada (PaCO₂ medido ${paco2} mmHg abaixo do esperado por Winter: ${paco2Min}–${paco2Max} mmHg — hiperventilação excessiva)`;
          distubioMistoDetectado = 'Acidose metabólica + alcalose respiratória (Tabela 58-2)';
        }
      }
      // 1.3 Acidose respiratória primária
      else if (paco2 > 45) {
        diagnosticoAcidoBase = 'Acidose respiratória';
        const deltaPaco2 = paco2 - 40;
        const hco3EsperadoAgudo = Number((24 + 0.1 * deltaPaco2).toFixed(1));
        const hco3EsperadoCronico = Number((24 + 0.35 * deltaPaco2).toFixed(1));

        detalhes.push({
          campo: 'hco3_esperado',
          valor: `Agudo: ${hco3EsperadoAgudo} | Crônico: ${hco3EsperadoCronico}`,
          descricao: 'HCO₃⁻ esperado (agudo: +1 mEq/L p/ 10 mmHg; crônico: +3,5 mEq/L p/ 10 mmHg)',
        });

        if (Math.abs(hco3 - hco3EsperadoCronico) <= 2) {
          statusCompensacao = 'Acidose respiratória crônica em compensação metabólica adequada';
        } else if (Math.abs(hco3 - hco3EsperadoAgudo) <= 2) {
          statusCompensacao = 'Acidose respiratória aguda com compensação metabólica inicial';
        } else if (hco3 > hco3EsperadoCronico + 2) {
          statusCompensacao = 'Acidose respiratória associada a alcalose metabólica concomitante';
          distubioMistoDetectado = 'Acidose respiratória + alcalose metabólica';
        } else {
          statusCompensacao = 'Acidose respiratória associada a acidose metabólica concomitante';
          distubioMistoDetectado = 'Acidose respiratória + acidose metabólica';
        }
      } else {
        diagnosticoAcidoBase = 'Acidemia com parâmetros limítrofes';
        statusCompensacao = 'Reavaliar gasometria e correlação clínica';
      }
    }
    // CASO 2: ALCALEMIA (pH > 7.45)
    else if (ph > 7.45) {
      // 2.1 Alcalose mista
      if (hco3 > 26 && paco2 < 35) {
        diagnosticoAcidoBase = 'Alcalose mista (metabólica e respiratória)';
        statusCompensacao = 'Sem compensação; ambos os componentes respiratório e metabólico promovem alcalemia severa';
      }
      // 2.2 Alcalose metabólica primária
      else if (hco3 > 26) {
        diagnosticoAcidoBase = 'Alcalose metabólica';
        const paco2Esperado = 40 + 0.75 * (hco3 - 24);
        const paco2Min = Number((paco2Esperado - 2).toFixed(1));
        const paco2Max = Number((paco2Esperado + 2).toFixed(1));

        detalhes.push({
          campo: 'paco2_esperada',
          valor: `${paco2Min} a ${paco2Max} mmHg`,
          descricao: 'PaCO₂ esperada (+0,75 mmHg por mEq/L de HCO₃⁻ elevado)',
        });

        if (paco2 >= paco2Min && paco2 <= paco2Max) {
          statusCompensacao = `Em compensação respiratória adequada (hipoventilação compensatória; esperado: ${paco2Min}–${paco2Max} mmHg)`;
        } else if (paco2 > paco2Max) {
          statusCompensacao = `Alcalose metabólica associada a acidose respiratória concomitante (PaCO₂ ${paco2} mmHg superior ao esperado)`;
          distubioMistoDetectado = 'Alcalose metabólica + acidose respiratória';
        } else {
          statusCompensacao = `Alcalose metabólica sem compensação esperada ou com alcalose respiratória sobreposta (PaCO₂ ${paco2} mmHg inferior ao esperado)`;
          distubioMistoDetectado = 'Alcalose metabólica + alcalose respiratória (Tabela 58-2)';
        }
      }
      // 2.3 Alcalose respiratória primária
      else if (paco2 < 35) {
        diagnosticoAcidoBase = 'Alcalose respiratória';
        const deltaPaco2 = 40 - paco2;
        const hco3EsperadoAgudo = Number((24 - 0.2 * deltaPaco2).toFixed(1));
        const hco3EsperadoCronico = Number((24 - 0.4 * deltaPaco2).toFixed(1));

        detalhes.push({
          campo: 'hco3_esperado',
          valor: `Agudo: ${hco3EsperadoAgudo} | Crônico: ${hco3EsperadoCronico}`,
          descricao: 'HCO₃⁻ esperado (agudo: -2 mEq/L p/ 10 mmHg; crônico: -4 mEq/L p/ 10 mmHg)',
        });

        if (Math.abs(hco3 - hco3EsperadoCronico) <= 2) {
          statusCompensacao = 'Alcalose respiratória crônica compensada';
        } else if (Math.abs(hco3 - hco3EsperadoAgudo) <= 2) {
          statusCompensacao = 'Alcalose respiratória aguda com compensação inicial';
        } else if (hco3 < hco3EsperadoCronico - 2) {
          statusCompensacao = 'Alcalose respiratória associada a acidose metabólica concomitante';
          distubioMistoDetectado = 'Alcalose respiratória + acidose metabólica';
        } else {
          statusCompensacao = 'Alcalose respiratória associada a alcalose metabólica concomitante';
          distubioMistoDetectado = 'Alcalose respiratória + alcalose metabólica';
        }
      } else {
        diagnosticoAcidoBase = 'Alcalemia com parâmetros limítrofes';
        statusCompensacao = 'Reavaliar gasometria e correlação clínica';
      }
    }
    // CASO 3: pH NORMAL (7.35 a 7.45)
    else {
      // 3.1 Gasometria completamente normal
      if (paco2 >= 35 && paco2 <= 45 && hco3 >= 22 && hco3 <= 26) {
        const agElevado = anionGapCorrigido !== undefined && anionGapCorrigido > 14;
        if (agElevado) {
          diagnosticoAcidoBase = `Equilíbrio ácido-base com ânion gap elevado oculto (AGc ${anionGapCorrigido} mEq/L)`;
          statusCompensacao = 'pH normal mas com presença de ânions não mensurados aumentados (investigar acidose metabólica incipiente compensada)';
        } else {
          diagnosticoAcidoBase = 'Equilíbrio ácido-base normal';
          statusCompensacao = 'pH, PaCO₂ e HCO₃⁻ dentro das faixas fisiológicas de referência';
        }
      }
      // 3.2 Distúrbio misto compensado com pH normal (Tabela 58-2)
      else if (paco2 < 35 && hco3 < 22) {
        diagnosticoAcidoBase = 'Distúrbio ácido-base misto: Acidose metabólica e Alcalose respiratória concomitantes';
        statusCompensacao = 'Compensação mista mantendo pH na faixa normal (ex.: choque séptico inicial com acidose lática + hiperventilação reflexa)';
        distubioMistoDetectado = 'Acidose metabólica + alcalose respiratória compensada (Tabela 58-2)';
      } else if (paco2 > 45 && hco3 > 26) {
        diagnosticoAcidoBase = 'Distúrbio ácido-base misto ou crônico: Acidose respiratória e Alcalose metabólica';
        statusCompensacao = 'Retenção crônica de bicarbonato em paciente com hipercapnia crônica (ex.: DPOC) ou uso concomitante de diuréticos';
        distubioMistoDetectado = 'Acidose respiratória crônica ou Acidose respiratória + alcalose metabólica (Tabela 58-2)';
      } else {
        diagnosticoAcidoBase = 'Equilíbrio ácido-base compensado ou normal';
        statusCompensacao = 'Valores próximos à faixa de normalidade';
      }
    }

    // 3. Avaliação de Delta Ratio em acidose metabólica com AG elevado (Tabela 58-2)
    if (anionGapCorrigido !== undefined && anionGapCorrigido > 12) {
      if (deltaHco3 !== undefined && deltaAg !== undefined) {
        if (deltaHco3 <= 0 && deltaAg >= 5) {
          distubioMistoDetectado = 'Acidose com ânion gap elevado associada a alcalose metabólica concomitante (o HCO₃⁻ não caiu proporcionalmente ao AG)';
          avisos.push('Delta Gap: ΔAG >> ΔHCO₃⁻. O bicarbonato sérico permanece elevado em relação ao excesso de ânion gap, caracterizando alcalose metabólica associada (ex.: vômitos, uso de diuréticos, uremia).');
        } else if (deltaRatio !== undefined) {
          detalhes.push({
            campo: 'delta_ratio',
            valor: deltaRatio,
            descricao: `Delta Ratio (ΔAG/ΔHCO₃⁻: ${deltaAg} / ${deltaHco3})`,
          });

          if (deltaRatio < 0.4) {
            avisos.push('Delta Ratio <0,4: Predomínio de acidose metabólica hiperclorêmica (normal-AG) com componente mínimo de ânion gap elevado.');
          } else if (deltaRatio < 0.8) {
            distubioMistoDetectado = 'Acidose mista: acidose com ânion gap elevado + acidose hiperclorêmica (normal-AG)';
            avisos.push('Delta Ratio entre 0,4 e 0,8: Acidose metabólica mista (ânion gap elevado concomitante com acidose hiperclorêmica; ex.: cetoacidose em tratamento ou diarreia com sepse).');
          } else if (deltaRatio <= 2.0) {
            avisos.push('Delta Ratio entre 0,8 e 2,0: Acidose metabólica com ânion gap elevado pura (sem distúrbio metabólico associado).');
          } else {
            distubioMistoDetectado = 'Acidose com ânion gap elevado + alcalose metabólica concomitante';
            avisos.push('Delta Ratio >2,0: Acidose metabólica com AG elevado associada à alcalose metabólica preexistente ou retenção crônica de bicarbonato.');
          }
        }
      }
    }

    // 4. Avaliação de Oxigenação (PaO2/FiO2 e A-aDO2)
    let textoOxigenacao = '';
    let aado2Calculado: number | undefined;

    if (pao2 !== undefined && fio2Decimal !== undefined) {
      const pf = Number((pao2 / fio2Decimal).toFixed(1));
      let classificacaoPf = 'Normal';
      if (pf <= 100) classificacaoPf = 'Hipoxemia grave (critério Berlim SDRA grave)';
      else if (pf <= 200) classificacaoPf = 'Hipoxemia moderada (critério Berlim SDRA moderada)';
      else if (pf <= 300) classificacaoPf = 'Hipoxemia leve (critério Berlim SDRA leve)';

      detalhes.push({
        campo: 'pao2_fio2',
        valor: pf,
        descricao: `Relação PaO₂/FiO₂ (${classificacaoPf})`,
      });

      if (pf <= 300) {
        avisos.push(`Relação PaO₂/FiO₂ reduzida (${pf} mmHg): compatível com ${classificacaoPf}. Em pacientes em ventilação mecânica com PEEP ≥5 cmH₂O, preenche critérios de Berlim para SDRA.`);
      }

      // Cálculo do Gradiente Alvéolo-Arterial:
      // PAO2 = FiO2 * (Patm - PH2O) - (PaCO2 / 0.8) = FiO2 * (760 - 47) - (PaCO2 / 0.8)
      const paO2Alveolar = fio2Decimal * (760 - 47) - paco2 / 0.8;
      aado2Calculado = Number((paO2Alveolar - pao2).toFixed(1));

      let aado2EsperadoMax = 20;
      if (typeof dados.idade === 'number' && dados.idade > 0) {
        aado2EsperadoMax = Number(((dados.idade / 4) + 4).toFixed(1));
      }

      detalhes.push({
        campo: 'aado2',
        valor: aado2Calculado,
        descricao: `Gradiente A–aDO₂ calculado (esperado p/ idade: ≤${aado2EsperadoMax} mmHg)`,
      });

      if (aado2Calculado > aado2EsperadoMax) {
        avisos.push(`Gradiente A–aDO₂ elevado (${aado2Calculado} mmHg; esperado ≤${aado2EsperadoMax} mmHg): indica alteração intrínseca da troca gasosa alveolar (distúrbio V/Q, shunt intrapulmonar ou defeito de difusão) e não apenas hipoventilação pura.`);
      }

      textoOxigenacao = `PaO₂/FiO₂: ${pf} mmHg (${classificacaoPf}); A–aDO₂: ${aado2Calculado} mmHg.`;
    }

    // 5. Avaliação do Lactato Sérico
    let textoLactato = '';
    if (lactato !== undefined) {
      detalhes.push({
        campo: 'lactato',
        valor: lactato,
        descricao: `Lactato sérico (${lactato > 4.0 ? 'Hiperlactatemia grave' : lactato > 2.0 ? 'Hiperlactatemia moderada' : 'Normal'})`,
      });
      if (lactato > 4.0) {
        avisos.push('Lactato sérico >4,0 mmol/L: hiperlactatemia grave indicativa de hipoperfusão tecidual severa, choque séptico ou disóxia celular.');
        textoLactato = `Lactato ${lactato} mmol/L (gravemente elevado).`;
      } else if (lactato > 2.0) {
        avisos.push('Lactato sérico entre 2,1 e 4,0 mmol/L: hiperlactatemia intermediária. Investigar hipoperfusão, sepse precoce ou clearance hepático reduzido.');
        textoLactato = `Lactato ${lactato} mmol/L (moderadamente elevado).`;
      } else {
        textoLactato = `Lactato ${lactato} mmol/L (normal).`;
      }
    }

    // 6. Determinação do Nível de Gravidade Global da Gasometria
    let nivelGravidade: 'normal' | 'atencao' | 'alerta' | 'critico' = 'normal';
    if (ph < 7.20 || ph > 7.60 || (lactato !== undefined && lactato > 4.0) || (detalhes.some((d) => d.campo === 'pao2_fio2' && (d.valor as number) <= 100))) {
      nivelGravidade = 'critico';
    } else if (ph < 7.30 || ph > 7.52 || (lactato !== undefined && lactato > 2.0) || (detalhes.some((d) => d.campo === 'pao2_fio2' && (d.valor as number) <= 200))) {
      nivelGravidade = 'alerta';
    } else if (ph < 7.35 || ph > 7.45 || distubioMistoDetectado !== '') {
      nivelGravidade = 'atencao';
    }

    const partesResumo: string[] = [];
    if (distubioMistoDetectado) {
      partesResumo.push(`${diagnosticoAcidoBase} | ${distubioMistoDetectado}`);
    } else {
      partesResumo.push(`${diagnosticoAcidoBase} (${statusCompensacao})`);
    }
    if (textoOxigenacao) partesResumo.push(textoOxigenacao);
    if (textoLactato) partesResumo.push(textoLactato);

    const resumo = partesResumo.join(' | ');

    return {
      valor: ph,
      unidade: 'pH',
      resumo,
      nivelGravidade,
      detalhamento: detalhes,
      avisos,
    };
  },
  interpretar: (resultado) => {
    return `${resultado.resumo}. A interpretação gasométrica deve ser integrada à história clínica, ventilação do paciente e estado hemodinâmico.`;
  },
  populacaoAlvo: 'Adultos com gasometria arterial e dados bioquímicos disponíveis.',
  limitacoes: [
    'A acurácia depende da coleta arterial adequada sem bolhas de ar e com análise rápida.',
    'As fórmulas de compensação estimam respostas fisiológicas médias de populações adultas; desvios individuais exigem julgamento clínico.',
  ],
  referencias: [
    {
      titulo: 'Harrison\'s Principles of Internal Medicine, 21st Edition. Chapter 58: Acidosis and Alkalosis. Tables 58-1 and 58-2.',
      url: 'https://accessmedicine.mhmedical.com/book.aspx?bookID=3095',
    },
    {
      titulo: 'Kraut JA, Madias NE. Serum anion gap: its uses and limitations in clinical medicine. Clin J Am Soc Nephrol. 2007;2(1):162-174.',
      url: 'https://doi.org/10.2215/CJN.03020906',
    },
  ],
  versao: 'Harrison 21st Ed. / Winter canônico',
  ultimaRevisao: '2026-11-14',
  validar: (d) => {
    const erros: string[] = [];
    if (typeof d.ph !== 'number' || d.ph < 6.5 || d.ph > 8.0) {
      erros.push('pH arterial fora da faixa biológica plausível (6,50 a 8,00).');
    }
    if (typeof d.paco2 !== 'number' || d.paco2 < 5 || d.paco2 > 150) {
      erros.push('PaCO₂ fora do intervalo plausível (5 a 150 mmHg).');
    }
    if (typeof d.hco3 !== 'number' || d.hco3 < 1 || d.hco3 > 80) {
      erros.push('HCO₃⁻ fora da faixa biológica aceitável (1 a 80 mEq/L).');
    }
    if (typeof d.pao2 === 'number' && d.pao2 < 0) {
      erros.push('PaO₂ não pode ser negativa.');
    }
    return erros;
  },
};
