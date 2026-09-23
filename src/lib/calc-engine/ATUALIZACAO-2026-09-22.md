# Atualização do Motor de Decisão Clínica — 22/09/2026

## O que entra nesta versão

### Antropometria
- IMC — `imc`
- Superfície corporal, método de Mosteller — `superficie-corporal`
- Peso ideal, fórmula de Devine — `peso-ideal`
- Peso ajustado, usando `PIB + 0,4 × (peso atual − PIB)` — `peso-ajustado`

### Sinais vitais e gravidade geral
A ordem passa a ser PAM → Shock Index → NEWS2 → SOFA-2 → APACHE II.

### Função renal
- CKD-EPI
- Cockcroft-Gault
- FeNa
- FeUreia

Foram adicionados `sodio_urinario`, `creatinina_urinaria` e `ureia_urinaria` ao contexto compartilhado.

### Função hepática
- Child-Pugh
- MELD 3.0
- ALBI

### Laboratório / metabólico
- Osmolaridade plasmática calculada
- Osmolaridade efetiva
- Ânion gap
- Ânion gap corrigido por albumina
- Delta gap
- Sódio corrigido pela glicemia

Foi adicionado `cloro` ao contexto compartilhado.

### Risco / profilaxia
- RCRI
- Pádua

### Avaliações neurológicas / específicas
- HISS (Head Injury Severity Scale)
- CIWA-Ar
- COWS

## Fórmulas adotadas

- IMC = peso / altura², com altura em metros.
- SC (Mosteller) = √[(altura(cm) × peso(kg)) / 3600].
- Peso ideal (Devine): homem = 50 + 2,3 × polegadas acima de 5 pés; mulher = 45,5 + 2,3 × polegadas acima de 5 pés.
- Peso ajustado = peso ideal + 0,4 × (peso atual − peso ideal).
- FeNa (%) = [(Na urinário × Cr sérica) / (Na sérico × Cr urinária)] × 100.
- FeUreia (%) = [(ureia urinária × Cr sérica) / (ureia sérica × Cr urinária)] × 100.
- Osmolaridade plasmática calculada = 2 × Na + glicose/18 + ureia/6, assumindo que o campo `ureia` está em mg/dL de ureia total, não BUN.
- Osmolaridade efetiva = 2 × Na + glicose/18.
- Ânion gap = Na − (Cl + HCO₃⁻), sem K⁺.
- AG corrigido por albumina = AG + 2,5 × (4 − albumina [g/dL]).
- Delta gap = (AG corrigido − 12) − (24 − HCO₃⁻).
- Na corrigido pela glicemia = Na medido + 2,4 × [(glicose − 100)/100] quando glicose >100 mg/dL.
- RCRI: seis predictores, 1 ponto cada.
- Pádua: 11 fatores ponderados; ≥4 pontos é considerado alto risco no modelo original.
- CIWA-Ar: soma de 10 itens, máximo 67.
- COWS: soma de 11 itens, máximo 48.
- HISS: classificação de gravidade baseada principalmente no GCS inicial pós-ressuscitação, com modificadores de lesão craniana; nesta implementação o resultado mostra a categoria e preserva o GCS como valor principal.

## Decisões de interface

1. O `registry` passa a ser a fonte única da ordem de resultados.
2. A linha-resumo é gerada por uma ordem fixa, independente da ordem em que os campos foram preenchidos.
3. Ao final dos resultados é gerado um resumo clínico em texto corrido, com os valores clínicos e principais escores em negrito, no formato solicitado para cópia/registro.
4. O Glasgow atual continua sendo o dado compartilhado para as calculadoras que dele dependem; a HISS usa um campo separado para o GCS inicial pós-ressuscitação.
5. As ferramentas novas são opcionais: o Motor só calcula uma ferramenta quando todos os campos obrigatórios daquela ferramenta estiverem presentes.

## Pontos de segurança clínica

- CIWA-Ar e COWS são instrumentos de monitorização e não devem ser usados isoladamente para diagnóstico ou como prescrição automática; pontos de corte terapêuticos podem variar conforme protocolo.
- FeUreia tem utilidade limitada para separar lesão renal pré-renal de intrínseca e não deve ser usada isoladamente.
- RCRI é perioperatório, para cirurgia não cardíaca; não é um escore cardiovascular geral.
- Pádua foi derivado para pacientes clínicos hospitalizados; risco hemorrágico e contraindicações à profilaxia precisam ser avaliados separadamente.
- qSOFA não é adicionado nesta atualização; as recomendações contemporâneas da Surviving Sepsis Campaign 2026 favorecem NEWS/NEWS2, MEWS ou SIRS em vez de qSOFA como ferramenta única de triagem hospitalar.

## Fontes primárias / referências de implementação

- Stein SC, Spettell C. *The Head Injury Severity Scale (HISS): a practical classification of closed-head injury*. Brain Inj. 1995. https://pubmed.ncbi.nlm.nih.gov/7550215/
- Sullivan JT et al. *Assessment of alcohol withdrawal: the revised clinical institute withdrawal assessment for alcohol scale (CIWA-Ar).* Br J Addict. 1989. https://pubmed.ncbi.nlm.nih.gov/2597811/
- Wesson DR, Ling W. *The Clinical Opiate Withdrawal Scale (COWS).* J Psychoactive Drugs. 2003. https://pubmed.ncbi.nlm.nih.gov/12924748/
- Barbar S et al. *The Padua Prediction Score.* J Thromb Haemost. 2010. https://pubmed.ncbi.nlm.nih.gov/20738765/
- Lee TH et al. *Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery.* Circulation. 1999. https://pubmed.ncbi.nlm.nih.gov/?term=Lee+1999+revised+cardiac+risk+index
- Mosteller RD. *Simplified calculation of body-surface area.* N Engl J Med. 1987. https://doi.org/10.1056/NEJM198710223171717
- Hillier TA, Abbott RD, Barrett EJ. *Hyponatremia: evaluating the correction factor for hyperglycemia.* Am J Med. 1999. https://pubmed.ncbi.nlm.nih.gov/10225241/
- 2024 AHA/ACC Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000001285
- Utility of fractional excretion of urea in acute kidney injury with comparison to fractional excretion of sodium: systematic review and meta-analysis. 2024. https://pubmed.ncbi.nlm.nih.gov/38768779/
- Surviving Sepsis Campaign International Guidelines 2026. https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026
