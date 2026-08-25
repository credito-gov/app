# Task 014 — Landing Page: SEO, Meta Tags e robots.txt

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 013 merged
> **Estimativa:** 3-4h
> **Branch:** `feat/014-landing-seo`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 013 está **merged** — todas as seções de conteúdo (Header a Footer) precisam existir para auditar hierarquia de heading e escrever meta description coerente.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/014-landing-seo
   ```
4. Esta é a task **9 da série Landing Page** — última da série, fecha o conjunto iniciado na task 006.

---

## Contexto

Com as 8 seções da landing implementadas (tasks 007-013), esta task cobre o que não é visual: metadados para SEO/compartilhamento social, e uma política de `robots.txt`.

**Decisão confirmada com o responsável do projeto sobre o `robots.txt`:** o objetivo não é impedir indexação (isso anularia o propósito de SEO desta mesma task). A política é: **permitir buscadores de verdade** (Google, Bing, etc.) e **bloquear especificamente crawlers de IA/scraping conhecidos** (treino de modelo, agregadores).

---

## Objetivo

Adicionar meta tags de SEO e Open Graph/Twitter Card ao `index.html`, criar `robots.txt` com a política acima, criar `sitemap.xml` mínimo, e corrigir a hierarquia semântica de headings (`h1`/`h2`) nas seções já implementadas — a landing inteira ainda usa `<p>` para títulos porque essa é a saída literal do Figma MCP (bloco de referência, não HTML semântico final).

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/index.html` | Meta tags de SEO, Open Graph, Twitter Card, favicon |
| `app/landing-page/public/robots.txt` | Política: permite buscadores, bloqueia bots de IA/scraping conhecidos |
| `app/landing-page/public/sitemap.xml` | Sitemap mínimo (página única) |
| `app/landing-page/src/components/Hero.tsx` | Ajuste: título principal em `<h1>` (era `<p>`) |
| `app/landing-page/src/components/SocialProof.tsx`, `ProblemSolution.tsx`, `Features.tsx`, `Pricing.tsx`, `FaqAndFinalCta.tsx` | Ajuste: título de cada seção em `<h2>` (era `<p>`) |
| `docs/tasks/walkthrough/014-landing-seo.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não bloquear buscadores de verdade (Google, Bing, etc.) — isso contradiz o objetivo de SEO desta task
- ❌ Não usar `Disallow: /` genérico para todos os user-agents — a política é seletiva (ver lista abaixo)
- ❌ Não configurar Google Search Console, Google Analytics ou qualquer ferramenta de terceiros que exija conta/credencial — fora do escopo desta task, é decisão de negócio à parte
- ❌ Não criar imagem de Open Graph nova via IA/design — usar um placeholder simples e documentar como pendência (ver "Decisões em aberto" abaixo) se não houver asset do Figma para isso
- ❌ Não reestruturar o layout visual das seções ao trocar `<p>` por `<h1>`/`<h2>` — só a tag muda, o estilo (classes Tailwind) permanece idêntico
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos

### Meta tags em `index.html`

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CreditoGov — Crédito tributário CBS/IBS, todo santo dia</title>
<meta name="description" content="Sincronizamos com a Receita Federal todos os dias, mostramos exatamente quanto sua empresa tem de crédito de CBS/IBS e liberamos o caminho para compensar ou antecipar." />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="CreditoGov — Pare de deixar crédito tributário parado na planilha" />
<meta property="og:description" content="Sincronizamos com a Receita Federal todos os dias, mostramos exatamente quanto sua empresa tem de crédito de CBS/IBS e liberamos o caminho para compensar ou antecipar." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://[dominio-a-definir]" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="CreditoGov — Pare de deixar crédito tributário parado na planilha" />
<meta name="twitter:description" content="Sincronizamos com a Receita Federal todos os dias e liberamos o caminho para compensar ou antecipar seu crédito de CBS/IBS." />
<meta name="twitter:image" content="/og-image.png" />
```

Título e descrição usam o mesmo texto do H1/parágrafo da Hero (task 008) — não inventar copy nova.

### `robots.txt` (`app/landing-page/public/robots.txt`)

```
# Buscadores — permitidos
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawlers de IA / scraping — bloqueados
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: PerplexityBot
Disallow: /

# Demais robôs — permitido por padrão
User-agent: *
Allow: /

Sitemap: https://[dominio-a-definir]/sitemap.xml
```

> A lista de bots de IA muda com o tempo (novos user-agents surgem). Esta é uma lista razoável no momento da task — não é uma garantia de bloqueio total, `robots.txt` é um pedido educado, não uma barreira técnica.

### `sitemap.xml` (`app/landing-page/public/sitemap.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://[dominio-a-definir]/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### Hierarquia de headings a corrigir

| Componente | Elemento a trocar | De → Para |
|---|---|---|
| `Hero.tsx` | Título "Pare de deixar crédito..." | `<p>` → `<h1>` |
| `ProblemSolution.tsx` | Título "O crédito existe..." | `<p>` → `<h2>` |
| `Features.tsx` | Título "Três coisas que resolvem..." | `<p>` → `<h2>` |
| `Pricing.tsx` | Título "Um plano só..." | `<p>` → `<h2>` |
| `FaqAndFinalCta.tsx` | Título "Perguntas frequentes" | `<p>` → `<h2>` |

Apenas **um** `<h1>` deve existir na página inteira (o da Hero). Manter as classes Tailwind existentes ao trocar a tag — não é uma reestilização.

---

## Decisões em aberto

- [ ] **Domínio de produção** ainda não definido (depende do deploy no Render.com, fora do escopo desta task) — usar `[dominio-a-definir]` como placeholder em `og:url`, `sitemap.xml` e no `Sitemap:` do `robots.txt`, e documentar isso no walkthrough para atualização futura
- [ ] **Imagem de Open Graph** (`og-image.png`, 1200x630) não existe no Figma — usar um placeholder simples (ex: fundo verde + logo "CreditoGov") e sinalizar como pendência de design real

---

## Passos sugeridos

1. Adicionar as meta tags no `<head>` de `app/landing-page/index.html`
2. Criar `og-image.png` placeholder simples (1200x630) e salvar em `app/landing-page/public/`
3. Criar `public/robots.txt` com a política acima
4. Criar `public/sitemap.xml`
5. Trocar `<p>` por `<h1>`/`<h2>` nos 5 componentes listados na tabela, mantendo as classes Tailwind
6. Testar `npm run build` e verificar no HTML gerado que as meta tags estão presentes
7. Validar `robots.txt` acessando `http://localhost:5173/robots.txt` em dev
8. Criar o walkthrough em `docs/tasks/walkthrough/014-landing-seo.md` — **somente depois do PR aberto**, documentando os dois itens de "Decisões em aberto"
9. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 014
10. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] `index.html` tem `title`, `meta description`, Open Graph e Twitter Card completos
- [ ] `public/robots.txt` permite `Googlebot`/`Bingbot`/`*` e bloqueia a lista de bots de IA/scraping
- [ ] `public/sitemap.xml` presente e válido (XML bem formado)
- [ ] Apenas um `<h1>` na página inteira (Hero); demais títulos de seção em `<h2>`
- [ ] Nenhuma mudança visual/estilo além da troca de tag (`<p>` → `<h1>`/`<h2>`)
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/014-landing-seo.md` criado com evidências reais, incluindo os itens pendentes (domínio, imagem OG)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 014

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/013-landing-footer.md`](013-landing-footer.md) — task anterior da série
- [`docs/tasks/006-landing-page-architecture.md`](006-landing-page-architecture.md) — deploy no Render.com, de onde sairá o domínio final
