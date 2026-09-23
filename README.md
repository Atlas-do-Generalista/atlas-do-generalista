# Atlas do Generalista

**Manual aberto de medicina para o generalista.** Um projeto colaborativo de educação médica voltado à prática clínica, com conteúdo organizado para consulta rápida na emergência, enfermaria e atenção primária.

🌐 **Site:** https://atlas-do-generalista.github.io/atlas-do-generalista/

## Sobre o Atlas

O Atlas do Generalista reúne conteúdo médico prático, raciocínio clínico, procedimentos, protocolos e ferramentas de apoio à decisão. A proposta é transformar conhecimento médico em material de consulta **claro, acionável, verificável e fácil de atualizar**.

O projeto é organizado em oito Livros:

| Livro | Tema                                                             |
| ----- | ---------------------------------------------------------------- |
| I     | Raciocínio Clínico e Tomada de Decisão                           |
| II    | Procedimentos Médicos, Habilidades Invasivas & Trauma            |
| III   | Oncologia Prática, Emergências Oncológicas & Paliativismo        |
| IV    | Pediatria e Emergências Pediátricas para o Generalista           |
| V     | Ginecologia, Obstetrícia & Urgências Gineco-Obstétricas          |
| VI    | Toxicologia Clínica e Envenenamentos                             |
| VII   | Medicina Legal, Atestados, Documentação & Deontologia            |
| VIII  | Gestão do Plantão, Carreira, Prescrição & Ferramentas de Suporte |

O roadmap editorial atual prevê **144 capítulos** distribuídos nesses oito Livros. A lista de temas e seus respectivos status está em `Chamada de Capítulos.md`.

## Princípios editoriais

O Atlas prioriza:

* **Utilidade clínica:** o leitor deve encontrar rapidamente a informação necessária para conduzir um caso.
* **Evidência:** recomendações, doses, critérios e algoritmos devem ser sustentados por referências adequadas.
* **Atualização:** guidelines e literatura relevante devem ser revisadas periodicamente.
* **Rastreabilidade:** capítulos publicados mantêm autoria, ORCID, revisão científica, data e DOI quando disponível.
* **Originalidade:** textos e diagramas devem ser produzidos originalmente para o Atlas.
* **Revisão científica:** cada capítulo publicado passa por curadoria editorial e revisão antes da publicação.

O Atlas é uma ferramenta educacional e de consulta. **Não substitui diretrizes oficiais, protocolos institucionais, avaliação clínica ou julgamento profissional.**

## Motor de Decisão Clínica

O Atlas possui um motor independente de ferramentas de cálculo e apoio à decisão. A ideia central é que o usuário **preencha os dados do paciente uma vez** e o sistema reutilize essas informações para todas as ferramentas compatíveis, em vez de exigir um formulário separado para cada calculadora.

A entrada principal é um `ContextoPaciente` compartilhado. Cada calculadora declara quais variáveis necessita, e o `registry` central determina a ordem e o conjunto de ferramentas disponíveis.

### Organização do Motor

O Motor é dividido em quatro frentes:

| Módulo                | Finalidade                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Condição atual**    | Dados transversais do paciente e cálculos gerais aplicáveis a múltiplas situações clínicas.            |
| **Quadro específico** | Ferramentas dirigidas a uma síndrome, doença ou situação clínica específica.                           |
| **Gestação**          | Datação, antropometria, crescimento materno, pressão arterial, rastreio e acompanhamento do pré-natal. |
| **Criança**           | Ferramentas adaptadas à avaliação pediátrica.                                                          |

### Calculadoras disponíveis em Condição atual

#### Antropometria

* IMC
* Superfície corporal
* Peso ideal
* Peso ajustado

#### Sinais vitais e gravidade geral

* Pressão arterial média (PAM)
* Shock Index
* NEWS2
* SOFA-2
* APACHE II

#### Função renal

* CKD-EPI 2021
* Cockcroft-Gault
* Fração de excreção de sódio (FeNa)
* Fração de excreção de ureia (FeUreia)

#### Função hepática

* Child-Pugh
* MELD 3.0
* ALBI

#### Laboratório e metabolismo

* Osmolaridade plasmática calculada
* Osmolaridade efetiva
* Ânion gap
* Ânion gap corrigido pela albumina
* Delta gap
* Sódio corrigido pela glicemia

#### Risco e profilaxia

* Revised Cardiac Risk Index (RCRI / Índice de Lee)
* Escore de Pádua

#### Avaliações neurológicas e específicas

* HISS — Head Injury Severity Scale
* CIWA-Ar
* COWS

O resultado das calculadoras é organizado por contexto clínico. Quando possível, as ferramentas reutilizam variáveis já informadas no paciente e exibem os componentes do cálculo para facilitar auditoria e aprendizado.

## Arquitetura do Motor

A arquitetura do Motor foi desenhada para facilitar manutenção e expansão:

```text
ContextoPaciente
      │
      ├── dados demográficos
      ├── sinais vitais
      ├── neurologia
      ├── laboratório
      ├── gasometria
      ├── suporte cardiovascular/respiratório
      └── variáveis específicas
               │
               ▼
         Motor de cálculo
               │
        ┌──────┴──────┐
        ▼             ▼
     registry       engine
        │             │
        └──────┬──────┘
               ▼
          Calculadoras
```

As calculadoras individuais ficam em `src/lib/calc-engine/calculadoras/`. O registro central fica em `src/lib/calc-engine/registry.ts`; a execução e a avaliação de disponibilidade ficam em `src/lib/calc-engine/engine.ts`; e os tipos compartilhados ficam em `src/lib/calc-engine/types.ts`.

Essa estrutura permite adicionar uma nova ferramenta sem transformar o formulário principal em um conjunto de formulários independentes.

## Conteúdo médico

O conteúdo editorial vive em `src/content/docs/` e é organizado pelos oito Livros:

```text
src/content/docs/
├── livro1/
├── livro2/
├── livro3/
├── livro4/
├── livro5/
├── livro6/
├── livro7/
└── livro8/
```

O Astro/Starlight carrega esses arquivos por meio do `docsLoader()` configurado em `src/content.config.ts`.

### Metadados acadêmicos

Os capítulos podem registrar autoria, ORCID, revisor, data e DOI. O componente `src/components/CustomTitle.astro` usa esses metadados para apresentar as informações acadêmicas no topo do capítulo.

Exemplo de frontmatter:

```yaml
---
title: "Título do Capítulo"
autores:
  - nome: "Nome Completo"
    orcid: "0000-0000-0000-0000"
revisor: "Nome do Revisor (https://orcid.org/0000-0000-0000-0000)"
date: "2026-01-01"
doi: "10.5281/zenodo.0000000"
---
```

O campo `doi` deve conter o identificador do DOI; o componente do Atlas monta o link correspondente.

## Como contribuir

### Autores

Quem deseja escrever um capítulo deve primeiro consultar `Chamada de Capítulos.md` para escolher um tema dentro do roadmap editorial e depois utilizar o formulário de autores.

Formulário: https://tally.so/r/2EG5X9

O `Manual do Autor.md` descreve o formato da submissão, padrão de escrita, referências, uso de diagramas, uso responsável de IA e responsabilidades do autor.

### Revisores

A revisão científica é realizada diretamente no GitHub. Depois da candidatura e da triagem, o revisor recebe acesso adequado ao repositório e utiliza Pull Requests e/ou Issues para registrar comentários, sugestões e pareceres.

Formulário: https://tally.so/r/VLOAA6

O `Manual do Revisor.md` apresenta os critérios para atualidade, correção, referência, coerência e originalidade.

### Fluxo editorial

```text
Submissão
   ↓
Triagem editorial
   ↓
Revisão científica
   ↓
Ajustes pelo autor, quando necessários
   ↓
Aprovação
   ↓
Publicação
```

A equipe editorial organiza o processo, mas a responsabilidade pelo conteúdo clínico permanece com os autores e revisores responsáveis pelo capítulo.

## Stack técnica

* **Astro** — geração do site.
* **Starlight** — documentação, navegação e infraestrutura editorial do site.
* **TypeScript** — tipos e lógica do Motor de Decisão Clínica.
* **GitHub** — versionamento, colaboração e fluxo editorial.
* **GitHub Pages** — hospedagem do site.
* **GitHub Actions** — build e deploy automáticos.

O site é estático e não depende de um servidor próprio para publicação.

## Estrutura do repositório

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # Build e deploy para GitHub Pages
├── public/
│   └── images/uploads/             # Imagens utilizadas pelo conteúdo
├── src/
│   ├── assets/
│   │   └── custom.css              # Identidade visual do Atlas
│   ├── components/
│   │   └── CustomTitle.astro       # Metadados acadêmicos dos capítulos
│   ├── content/
│   │   └── docs/
│   │       ├── livro1/ ... livro8/ # Conteúdo editorial
│   │       └── index.mdx            # Página inicial
│   ├── lib/
│   │   └── calc-engine/
│   │       ├── calculadoras/       # Ferramentas individuais
│   │       ├── engine.ts           # Orquestração do Motor
│   │       ├── registry.ts         # Registro e ordem das ferramentas
│   │       └── types.ts             # Tipos e ContextoPaciente
│   ├── pages/
│   │   └── calculadora/
│   │       ├── index.astro         # Entrada do Motor
│   │       ├── condicao-atual.astro
│   │       ├── quadro-especifico.astro
│   │       ├── gestacao.astro
│   │       └── crianca.astro
│   └── content.config.ts            # Schema e loader do conteúdo
├── .gitignore
├── AGENTS.md                        # Instruções para agentes de desenvolvimento
├── Chamada de Capítulos.md          # Roadmap editorial
├── Manual do Autor.md               # Guia de submissão
├── Manual do Revisor.md             # Guia de revisão
├── astro.config.mjs                 # Configuração Astro/Starlight
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Desenvolvimento local

O projeto utiliza Node.js e npm.

```bash
npm install
npm run dev
```

O servidor local fica disponível por padrão em `localhost:4321`.

### Comandos principais

| Comando             | Função                               |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Inicia o servidor de desenvolvimento |
| `npm run build`     | Gera o build de produção             |
| `npm run preview`   | Pré-visualiza o build de produção    |
| `npm run astro ...` | Executa comandos da CLI do Astro     |

Antes de enviar mudanças para `main`, é recomendável executar pelo menos:

```bash
npm run build
git status
git add .
git commit -m "Descrição da mudança"
git push
```

## Deploy

O deploy é automático. Um `push` para a branch `main` dispara o workflow `.github/workflows/deploy.yml`, que:

1. faz checkout do repositório;
2. instala Node.js;
3. instala as dependências;
4. executa `npm run build`;
5. publica `dist/` no GitHub Pages.

## Segurança e manutenção

O repositório não deve receber:

* credenciais;
* tokens;
* arquivos `.env`;
* dados identificáveis de pacientes;
* documentos clínicos reais;
* arquivos gerados de build.

O `.gitignore` já exclui, entre outros, `node_modules/`, `dist/`, `.astro/` e arquivos de ambiente.

Mudanças em ferramentas médicas devem ser tratadas como código clínico: fórmula, pontos de corte, unidade, população, versão e referência precisam ser verificáveis antes da publicação.

## Licença e citação

O repositório atualmente não declara um arquivo `LICENSE` na raiz. Portanto, não se deve assumir automaticamente uma licença de software específica para todo o código e conteúdo do projeto.

Os capítulos que receberem DOI podem ser citados individualmente conforme os seus metadados bibliográficos. Para contribuições sem DOI, utilize os dados de autoria, título, data e endereço do capítulo publicados pelo Atlas.

## Governança

O Atlas do Generalista é um projeto independente e aberto de educação médica. A coordenação editorial é responsável pela organização do processo, manutenção da plataforma e publicação; autores e revisores permanecem responsáveis pelo conteúdo científico sob sua autoria ou revisão.

---

**Atlas do Generalista**
Manual aberto de medicina para o generalista.

Construído com Astro + Starlight.
