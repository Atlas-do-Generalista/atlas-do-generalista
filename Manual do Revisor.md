# Manual do Revisor — Atlas do Generalista

Este manual reúne tudo o que você precisa saber para revisar um capítulo submetido ao Atlas do Generalista: como acessar o repositório, o que avaliar, como registrar sua revisão e quais critérios levam à reprovação de um artigo.

A revisão científica é a principal camada de controle de qualidade do Atlas. Um revisor atento é o que garante que o conteúdo publicado seja confiável, atual e original.

---

## 1. Acesso: tudo é feito pelo GitHub

O Atlas **não utiliza mais painel editorial via Netlify/CMS**. Todo o fluxo de submissão, revisão e publicação acontece diretamente no repositório do GitHub.

- Ao se candidatar como revisor pelo [formulário de revisores](https://tally.so/r/VLOAA6), você já é orientado a **criar uma conta no GitHub**, da forma que preferir (com e-mail pessoal, institucional, etc.). Se você já tem conta, não precisa criar outra.
- Após a triagem, o **editor-chefe** concede acesso ao repositório, adicionando seu usuário do GitHub como colaborador autorizado.
- Com o acesso liberado, você revisa o conteúdo diretamente nos arquivos do repositório (`src/content/docs/livroN/` para capítulos e/ou `src/content/submissions/` para submissões ainda não integradas, conforme o estágio do fluxo editorial no momento).
- Comentários, sugestões de alteração e o parecer final (aprovado/reprovado/ajustes solicitados) devem ser registrados via **Pull Request** (comentários de revisão, sugestões de linha, ou revisão formal de PR) ou via **Issues**, vinculando sempre o arquivo e o capítulo em questão.
- Se você não tem familiaridade com Git/GitHub além do básico (visualizar arquivos, comentar, aprovar um PR), isso é suficiente para revisar — não é necessário saber programar. Em caso de dúvida sobre o fluxo, pergunte à equipe editorial antes de iniciar.

---

## 2. O papel do revisor

O revisor científico tem três responsabilidades centrais:

1. **Atualidade** — confirmar que o conteúdo reflete a versão mais recente das guidelines e da literatura pertinente.
2. **Correção** — confirmar que as informações clínicas, doses, condutas e classificações estão factualmente corretas.
3. **Originalidade** — confirmar que o texto (e os diagramas, se houver) foram escritos/criados pelo autor, e não copiados ou parafraseados de forma muito próxima de uma fonte existente.

Nenhuma dessas três dimensões substitui a outra: um texto pode estar clinicamente correto e ainda assim ser reprovado por ser cópia de uma fonte; pode ser original e ainda assim ser reprovado por estar desatualizado.

---

## 3. Como avaliar atualidade das guidelines e da literatura

- Identifique **todas as guidelines/diretrizes citadas** no capítulo e verifique se existe uma versão mais recente publicada por essa mesma sociedade/órgão. Não confie apenas na data informada pelo autor — faça a checagem ativa.
- Avalie se o autor **incorporou artigos relevantes publicados após a guideline-base**, quando esses artigos mudam ou refinam a conduta (conforme orientado no Manual do Autor). A ausência de qualquer atualização pós-guideline, quando ela existe e é clinicamente relevante, é uma falha a ser apontada.
- Fique atento a condutas **"tradicionais" mas já superadas** — informações amplamente repetidas na prática clínica cotidiana, mas que a evidência mais recente já não sustenta.
- Se houver divergência real entre sociedades/diretrizes, verifique se o autor deixou isso explícito no texto, em vez de apresentar uma única conduta como consenso absoluto.

---

## 4. Como avaliar correção clínica

- Confira doses, unidades, vias de administração, valores de referência e critérios diagnósticos contra a fonte primária citada — não apenas contra o seu próprio conhecimento prévio, que também pode estar desatualizado.
- Verifique se cada afirmação factual, numérica ou normativa está de fato referenciada, e se a referência realmente sustenta o que está sendo dito (é comum uma referência genérica ser usada para uma afirmação específica que ela não cobre).
- Avalie a coerência interna do capítulo: um algoritmo de manejo deve ser internamente consistente do início ao fim, sem contradições entre seções.
- Se o capítulo incluir diagramas de manejo/diagnóstico/tratamento, confira se a **lógica clínica representada no diagrama** está correta e é coerente com o texto e as referências.

---

## 5. Como avaliar originalidade (evitar cópia / plágio)

Este é um critério eliminatório, não uma questão de estilo.

- **Busque trechos literais do texto** em mecanismos de busca (Google, Google Scholar) entre aspas, para verificar se o parágrafo foi copiado de um livro, artigo, apostila ou site já existente.
- Preste atenção a **parágrafos com "cheiro de tradução"** (estrutura de frase típica de inglês vertida ao português) — frequentemente indicam cópia de fonte estrangeira sem reelaboração.
- Uma paráfrase muito próxima da fonte (mesma ordem de ideias, mesmas frases com poucas palavras trocadas) conta como cópia, mesmo que a fonte esteja referenciada. Referenciar a fonte não licencia reprodução do texto — apenas embasa a informação.
- Diagramas devem ser **originais**, conforme o Manual do Autor. Se um diagrama for visualmente idêntico ou muito próximo ao de uma figura publicada (mesmo redesenhado), isso deve ser tratado como reprodução não autorizada.
- Em caso de dúvida, é preferível **sinalizar a suspeita e pedir esclarecimento ao autor** do que aprovar um conteúdo potencialmente copiado.

---

## 6. Como registrar a revisão

- Ao aprovar um capítulo, adicione (ou confirme que o autor/editor adicionou) a linha de revisor no frontmatter do arquivo, no formato:
  ```
  revisor: "Nome Completo (https://orcid.org/0000-0000-0000-0000)"
  ```
- Registre seus comentários e apontamentos diretamente no Pull Request correspondente, sinalizando claramente:
  - o que precisa ser corrigido (com trecho específico e sugestão, sempre que possível);
  - se a pendência é **bloqueante** (impede publicação) ou **sugestão** (melhoria, mas não impeditiva);
- O parecer final deve ser um dos três: **Aprovado**, **Aprovado com ajustes menores**, ou **Reprovado** (com justificativa objetiva, referenciando os critérios das seções 3 a 5 e o checklist abaixo).

---

## 7. Checklist de reprovação

Os critérios abaixo são **eliminatórios**: a resposta "sim" a qualquer um deles é suficiente para reprovar o capítulo na forma em que foi submetido, independentemente da qualidade do restante do texto.

- [ ] **Existe uma guideline/diretriz mais recente** que a usada como base, e o capítulo não a considerou? → **Reprovado.**
- [ ] **O texto (ou parte relevante dele) é cópia ou paráfrase muito próxima** de um livro, artigo, apostila ou outra fonte, mesmo que referenciada? → **Reprovado.**
- [ ] **Algum diagrama incluído é reprodução (ou adaptação não substancial)** de uma figura já publicada por terceiros? → **Reprovado.**
- [ ] **Há uma afirmação factual, dose ou conduta sem referência**, ou cuja referência citada não sustenta de fato o que é afirmado? → **Reprovado.**
- [ ] **A conduta descrita está incorreta ou desatualizada** frente às fontes primárias mais recentes verificadas pelo revisor? → **Reprovado.**
- [ ] **O capítulo está fora do escopo do generalista** definido no Manual do Autor (ex.: excessivamente subespecializado, sem aplicação prática direta)? → **Reprovado.**
- [ ] **Referências inexistentes, incorretas ou não verificáveis** (incluindo qualquer suspeita de referência gerada por IA sem checagem)? → **Reprovado.**
- [ ] **O capítulo omite divergências relevantes entre diretrizes**, apresentando uma única conduta como consenso quando não há consenso? → **Reprovado** (ou ajuste bloqueante, a critério do revisor, dependendo da gravidade).
- [ ] **Falta a lista de referências**, ou ela não está em formato Vancouver? → **Reprovado.**

Se **nenhum** dos critérios acima se aplicar, mas houver imprecisões pontuais, problemas de formatação ou oportunidades de melhoria didática, o capítulo pode ser **aprovado com ajustes menores**, registrando os pontos a corrigir antes da publicação final.

---

## 8. Responsabilidade do revisor

Ao aceitar revisar um capítulo, o revisor se compromete a:

- Basear seu parecer em checagem ativa das fontes, não apenas na leitura do texto submetido.
- Ser objetivo e específico nos apontamentos, permitindo que o autor entenda exatamente o que precisa ser corrigido.
- Sinalizar suspeitas de plágio ou desatualização mesmo quando isso significa reprovar um capítulo tecnicamente bem escrito.
- Manter isenção: a revisão avalia o conteúdo, não o autor.

A revisão científica é o que sustenta a credibilidade do Atlas do Generalista como fonte confiável para o generalista. Um parecer permissivo compromete todo o projeto — na dúvida, o critério deve ser o mais rigoroso, não o mais conveniente.

---

Dúvidas sobre este manual, sobre o fluxo de acesso ao repositório, ou sobre casos-limite de avaliação podem ser encaminhadas diretamente ao editor-chefe.
