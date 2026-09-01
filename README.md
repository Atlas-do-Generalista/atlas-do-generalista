# Atlas do Generalista

**Manual aberto de medicina para o generalista** — construído colaborativamente, com base em evidências científicas e revisão por pares.

🌐 **Site:** [atlas-do-generalista.github.io/atlas-do-generalista](https://atlas-do-generalista.github.io/atlas-do-generalista/)

---

## 📖 Sobre o projeto

O Atlas do Generalista é um projeto **colaborativo e de código aberto** que reúne raciocínio clínico rápido, condutas baseadas em evidências e suporte à tomada de decisão para o ambiente de emergência, enfermaria e atenção primária.

O conteúdo é organizado em **8 Livros temáticos**:

| Livro | Tema |
|---|---|
| I | Raciocínio Clínico e Tomada de Decisão |
| II | Procedimentos Médicos, Habilidades Invasivas & Trauma |
| III | Oncologia Prática, Emergências Oncológicas & Paliativismo |
| IV | Pediatria e Emergências Pediátricas para o Generalista |
| V | Ginecologia, Obstetrícia & Urgências Gineco-Obstétricas |
| VI | Toxicologia Clínica e Envenenamentos |
| VII | Medicina Legal, Atestados, Documentação & Deontologia |
| VIII | Gestão do Plantão, Carreira, Prescrição & Ferramentas de Suporte |

Cada capítulo publicado traz metadados de autoria acadêmica: autor(es) com **ORCID**, revisor científico, data de publicação e **DOI** (via Zenodo), exibidos automaticamente no topo da página.

---

## 🤝 Como contribuir

Existem duas formas principais de colaborar:

### ✍️ Quero ser autor

Você pode submeter um capítulo para integrar o Atlas. As submissões passam por avaliação editorial e revisão científica antes da publicação, e é necessária uma lista de referências no formato Vancouver ao final do texto.

👉 [Formulário para autores](https://tally.so/r/2EG5X9)

Basta enviar um arquivo `.txt` com todo o conteúdo editorial (sem outros dados). Para formatação em Markdown, veja este [pequeno manual](https://www.markdownguide.org/basic-syntax/).

### 🔎 Quero ser revisor

Ajude a avaliar a qualidade científica dos capítulos submetidos. Buscamos médicos, residentes, pesquisadores e outros profissionais qualificados.

👉 [Formulário para revisores](https://tally.so/r/VLOAA6)

> Ao realizar uma revisão diretamente em um arquivo, adicione uma linha `[revisor: "Nome Completo (https://orcid.org/0000-0000-0000-0000)"]` logo abaixo do cabeçalho (frontmatter) do capítulo.

### Painel editorial (para mantenedores)

O projeto conta com um painel editorial em `/admin`, construído com **Decap CMS** + **Netlify Identity**, com fluxo de trabalho editorial (Rascunho → Em Revisão → Pronto → Publicado) e uma coleção dedicada para cada um dos 8 Livros.

---

## 🛠️ Stack técnica

- **[Astro](https://astro.build)** + **[Starlight](https://starlight.astro.build)** — geração do site de documentação
- **GitHub Pages** — hospedagem, com deploy automático via **GitHub Actions** a cada push em `main`
- **Decap CMS** — painel editorial para autores/revisores, autenticado via Netlify Identity
- Metadados de citação acadêmica (autores, ORCID, revisor, DOI) definidos em `src/content.config.ts` e renderizados por um componente customizado (`src/components/CustomTitle.astro`)

---

## 🚀 Estrutura do projeto

```
.
├── .github/workflows/       # Deploy automático para GitHub Pages
├── public/
│   ├── admin/                # Painel editorial (Decap CMS)
│   └── images/uploads/       # Imagens enviadas via CMS
├── src/
│   ├── assets/
│   ├── components/
│   │   └── CustomTitle.astro # Card de metadados (autores, revisor, DOI, data)
│   ├── content/
│   │   ├── docs/
│   │   │   ├── livro1/ ... livro8/   # Capítulos publicados
│   │   │   ├── guides/, reference/   # Exemplos do template (a remover)
│   │   │   └── index.mdx             # Página inicial do site
│   │   └── submissions/      # Submissões recebidas antes da curadoria
│   └── content.config.ts     # Schema de conteúdo (Starlight + campos acadêmicos)
├── astro.config.mjs           # Configuração do Starlight, sidebar e dos 8 Livros
└── package.json
```

Cada capítulo (`.md`/`.mdx` em `src/content/docs/livroN/`) segue o schema:

```yaml
---
title: "Título do Capítulo"
autores:
  - nome: "Nome Completo"
    orcid: "0000-0000-0000-0000"
revisor: "Nome do Revisor (https://orcid.org/0000-0000-0000-0000)"
date: "AAAA-MM-DDTHH:mm:ss.sssZ"
doi: "https://doi.org/10.5281/zenodo.xxxxxxx"
---
```

---

## 💻 Rodando localmente

```bash
npm install
npm run dev       # inicia o servidor local em localhost:4321
```

| Comando | Ação |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção em `./dist/` |
| `npm run preview` | Pré-visualiza o build localmente |
| `npm run astro ...` | Executa comandos da CLI do Astro |

---

## 📄 Licença e citação

Os capítulos publicados recebem DOI individual via Zenodo, permitindo citação acadêmica formal de cada contribuição.

---

Construído com [Astro](https://astro.build) e [Starlight](https://starlight.astro.build).
