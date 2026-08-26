# Walkthrough — Task 014 (Landing Page: SEO, Meta Tags e robots.txt)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Adicionar meta tags de SEO e Open Graph/Twitter Card ao `index.html`, criar `robots.txt` com a política acordada, criar `sitemap.xml` mínimo, e corrigir a hierarquia semântica de headings (`h1`/`h2`) nas seções já implementadas. Última task da série Landing Page (006-014).

---

## O que foi entregue

### 1) Meta tags em `index.html`

Arquivo: `app/landing-page/index.html`

- `<title>` e `<meta name="description">` reaproveitando o copy real do H1/parágrafo da Hero
- Open Graph completo (`og:type`, `og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card completo (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### 2) `robots.txt`

Arquivo: `app/landing-page/public/robots.txt`

- Permite `Googlebot`, `Bingbot` e `*` (demais robôs)
- Bloqueia: `GPTBot`, `ChatGPT-User`, `CCBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Bytespider`, `PerplexityBot`
- Aponta para o `sitemap.xml`

### 3) `sitemap.xml`

Arquivo: `app/landing-page/public/sitemap.xml`

- Entrada única para a página raiz

### 4) `og-image.png`

Arquivo: `app/landing-page/public/og-image.png`

- Placeholder 1200x630 gerado via script Python (PIL): fundo `#111827`, logo (quadrado verde + "CreditoGov"), headline da Hero e barra de destaque verde — reaproveita a identidade visual já estabelecida no Header/Footer

### 5) Hierarquia de headings

**Nenhuma mudança necessária.** Ao implementar cada seção (tasks 008-012), os títulos já foram escritos com tags semânticas (`<h1>` na Hero, `<h2>` em ProblemSolution/Features/Pricing/FaqAndFinalCta), diferente do que o prompt da task 014 antecipava (que a saída literal do Figma MCP em `<p>` teria sido usada sem ajuste). Confirmado via `grep` que existe exatamente um `<h1>` na página inteira.

---

## Decisões técnicas fora do prompt

### Decisão 1: geração do `og-image.png` via script Python (PIL)

- **Contexto:** o prompt da task pedia um "placeholder simples (ex: fundo verde + logo)" para a imagem de Open Graph, já que não existe asset correspondente no Figma.
- **Alternativa escolhida:** gerei a imagem localmente com PIL (`Pillow`, já disponível no ambiente) em vez de pedir para o usuário fornecer um arquivo — reaproveita as cores exatas da marca (`#111827`, `#10b981`) e o copy real da Hero.
- **Sinalizado antes da execução:** ❌ Não necessário — está dentro do escopo já previsto explicitamente no prompt ("Decisões em aberto" já antecipava essa pendência e definia a solução aceitável).
- **Impacto:** nenhum. É um placeholder, documentado como tal; pendente de substituição por arte final de design.

---

## Validação executada

### Validação 1: `npm run lint`

- **Comando:** `npm run lint`
- **Saída resumida:** nenhuma saída (sem erros)
- **Conclusão:** ✅ passou

### Validação 2: `npm run build` e verificação das meta tags no HTML gerado

- **Comando:** `npm run build` + inspeção de `dist/index.html`
- **Saída resumida:** `dist/index.html` cresceu de `0.75 kB` (build anterior) para `2.04 kB`; todas as meta tags (description, og:*, twitter:*) presentes no arquivo final, título correto
- **Conclusão:** ✅ passou

### Validação 3: `robots.txt`, `sitemap.xml` e `og-image.png` servidos em dev

- **Comando:**
  ```
  npm run dev
  curl -s http://localhost:5184/robots.txt
  curl -s http://localhost:5184/sitemap.xml
  curl -s -o /dev/null -w "HTTP %{http_code}, content-type: %{content_type}\n" http://localhost:5184/og-image.png
  ```
- **Saída resumida:** os três endpoints retornaram o conteúdo esperado; `og-image.png` respondeu `HTTP 200, content-type: image/png`
- **Conclusão:** ✅ passou

### Validação 4: hierarquia de headings

- **Comando:** `grep -rn "<h1" app/landing-page/src/components`
- **Saída resumida:** apenas `Hero.tsx` contém `<h1>`; as demais seções já usavam `<h2>` desde a implementação original
- **Conclusão:** ✅ passou (sem necessidade de alteração)

---

## Evidências visuais

- `og-image.png` (1200x630) anexado ao PR — fundo escuro, logo verde, headline da Hero, barra de destaque.
- HTML final (`dist/index.html`) com todas as meta tags visíveis via inspeção manual do arquivo.

---

## Pontos importantes para code review

- `og:url`, `sitemap.xml` (`<loc>`) e o `Sitemap:` do `robots.txt` usam o placeholder literal `[dominio-a-definir]` — **atualizar quando o domínio de produção no Render.com for definido** (task 006, seção "Decisões em aberto" do README da landing).
- `og-image.png` é um placeholder gerado programaticamente, não arte final — sinalizar para o time de design substituir antes da publicação real.
- A lista de bots de IA bloqueados no `robots.txt` não é exaustiva nem permanente — novos user-agents de IA surgem com frequência; revisar periodicamente.

---

## Fora de escopo mantido

- Configuração de Google Search Console, Analytics ou qualquer ferramenta de terceiros
- Registro/configuração de domínio no Render.com

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add SEO meta tags, robots.txt and sitemap.xml`
2. `docs(tasks): add walkthrough and mark task 014 as developed`

---

## Fechamento da entrega

### Branch

- `feat/014-landing-seo`

### Commits realizados

1. `8773f30` — `feat(landing): add SEO meta tags, robots.txt and sitemap.xml`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/9
- **Título:** `feat(landing): SEO, meta tags e robots.txt`
- **Base:** `main`
- **Head:** `feat/014-landing-seo`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
