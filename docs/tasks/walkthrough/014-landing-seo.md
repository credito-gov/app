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

- Primeira versão: placeholder 1200x630 gerado via script Python (PIL), com um logo desenhado à mão (quadrado verde + texto).
- Versão final (após os assets reais chegarem, ver item 6): recomposta usando o lockup real da marca.

### 5) Hierarquia de headings

**Nenhuma mudança necessária.** Ao implementar cada seção (tasks 008-012), os títulos já foram escritos com tags semânticas (`<h1>` na Hero, `<h2>` em ProblemSolution/Features/Pricing/FaqAndFinalCta), diferente do que o prompt da task 014 antecipava (que a saída literal do Figma MCP em `<p>` teria sido usada sem ajuste). Confirmado via `grep` que existe exatamente um `<h1>` na página inteira.

### 6) Assets reais de marca (logo, ícone, favicon, og-image)

Durante a revisão desta task, o time de design entregou os arquivos reais do logotipo e ícones em `docs/00-project/assets/` (`logo.png`, `icon.png`, `brand.png`), a pedido do responsável do projeto. Substituídos os placeholders:

- **Header/Footer:** o quadrado verde placeholder virou o ícone de marca real. No Header (fundo branco), usa as cores originais do ícone. No Footer (fundo escuro `#111827`), foi gerada uma variante monocromática branca (`icon-mark-white.png`) — o navy original do ícone (`#354363`) tinha contraste baixo demais contra o fundo do footer.
- **Favicon:** gerado a partir do ícone real (`public/favicon.png`, 128x128), substitui o `favicon.svg` padrão do template Vite (removido).
- **`og-image.png`:** recomposta usando o lockup real da marca (ícone + wordmark coloridos) sobre o fundo escuro, no lugar do logo desenhado à mão da primeira versão.
- Arquivos-fonte de `docs/00-project/assets/` (originais em alta resolução, fundo branco opaco) foram processados localmente (fundo branco removido por threshold de luminosidade, recortados, redimensionados) — apenas as versões otimizadas para web foram commitadas em `app/landing-page/src/assets/brand/` e `public/`, não os originais em alta resolução.

---

## Decisões técnicas fora do prompt

### Decisão 1: geração do `og-image.png` via script Python (PIL)

- **Contexto:** o prompt da task pedia um "placeholder simples (ex: fundo verde + logo)" para a imagem de Open Graph, já que não existe asset correspondente no Figma.
- **Alternativa escolhida:** gerei a imagem localmente com PIL (`Pillow`, já disponível no ambiente) em vez de pedir para o usuário fornecer um arquivo — reaproveita as cores exatas da marca (`#111827`, `#10b981`) e o copy real da Hero.
- **Sinalizado antes da execução:** ❌ Não necessário — está dentro do escopo já previsto explicitamente no prompt ("Decisões em aberto" já antecipava essa pendência e definia a solução aceitável).
- **Impacto:** nenhum. Foi substituída pela versão com assets reais (item 6) na sequência da mesma task.

### Decisão 2: variante branca do ícone para o Footer

- **Contexto:** o ícone de marca real tem duas cores (navy `#354363` e verde `#29a672`). No fundo escuro do Footer (`#111827`), o navy praticamente desaparece por baixo contraste.
- **Alternativa escolhida:** gerar uma variante monocromática branca do ícone (todos os pixels opacos viram branco puro, preservando o canal alfa/silhueta) só para uso no Footer — prática padrão para logos em fundo escuro. Verificado visualmente contra o fundo real do footer antes de integrar.
- **Sinalizado antes da execução:** ❌ Não necessário — é uma correção de contraste objetiva, não uma escolha de design com múltiplas alternativas razoáveis.
- **Impacto:** nenhum negativo; melhora a legibilidade do logo no rodapé.

### Decisão 3: commit `6a060a3` ("Changing business plan and add assets") apareceu na branch fora do meu controle

- **Contexto:** entre o commit do walkthrough inicial (`4c5f4f9`) e o commit dos assets de marca, apareceu na branch `feat/014-landing-seo` um commit de autoria do próprio Daniel (`6a060a3`), feito fora desta sessão, contendo os PNGs de marca **e também** mudanças em `docs/PROJECT_CONTEXT.md`, `docs/00-project/docs/01_PLANO_DE_NEGOCIO.md`, `02_MODELO_NEGOCIO.md`, `11_KANBAN.md`, `docs/readme.md` e um novo arquivo `00_RELATORIO_EXECUTIVO_COMPLETO.md`.
- **Sinalizado antes de prosseguir:** ✅ Sim — parei e perguntei explicitamente antes de continuar, já que esse commit já havia sido empurrado (`git push`) para o PR #9 junto com o trabalho desta task, violando a regra do `AGENTS.md` de "PR contém apenas commits da task". Daniel confirmou manter tudo junto no PR #9.
- **Nota de conteúdo relevante:** esse commit também **resolve** a decisão de monetização que estava em aberto no `PROJECT_CONTEXT.md` §12 (referenciada na task 011/Pricing) — o item "Modelo de monetização — SaaS direto, freemium, outra abordagem?" foi substituído por "Go-to-market definido: SaaS direto, com parcerias contábeis como canal comercial primário". O **valor exato** do plano continua indefinido, então os placeholders `R$ [valor]` e `[x]%` em `Pricing.tsx` (task 011) permanecem corretos como estão — nenhuma mudança de código necessária por causa disso.
- **Impacto:** o PR #9 passa a conter, além do trabalho desta task, um commit de conteúdo de negócio não relacionado a código. Aceito explicitamente pelo responsável do projeto.

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

### Validação 5: assets reais de marca — build e carregamento

- **Comando:** `npm run build` + inspeção de `dist/assets/` e verificação em runtime (`img.complete && img.naturalWidth > 0`) no Header e no Footer
- **Saída resumida:** `icon-mark.png` (5.97 kB) emitido como arquivo separado; `icon-mark-white.png` (2.7 kB, abaixo do limite de inline de 4kB do Vite) embutido como base64 no bundle — ambos carregam sem erro (`headerLoaded: true, footerLoaded: true`), dimensões corretas (77x96)
- **Conclusão:** ✅ passou

### Validação 6: contraste do ícone branco no Footer

- **Comando:** composição de teste do `icon-mark-white.png` sobre um canvas na cor exata do Footer (`#111827`) via PIL, inspecionado visualmente
- **Saída resumida:** ícone nitidamente legível em branco sólido sobre o fundo escuro
- **Conclusão:** ✅ passou

---

## Evidências visuais

- `og-image.png` (1200x630) final, usando o lockup real da marca sobre fundo escuro.
- `favicon.png` (128x128) gerado a partir do ícone real, legível mesmo em miniatura.
- Composição de teste do ícone branco sobre o fundo do Footer, confirmando contraste adequado.
- HTML final (`dist/index.html`) com todas as meta tags visíveis via inspeção manual do arquivo.

---

## Pontos importantes para code review

- `og:url`, `sitemap.xml` (`<loc>`) e o `Sitemap:` do `robots.txt` usam o placeholder literal `[dominio-a-definir]` — **atualizar quando o domínio de produção no Render.com for definido** (task 006, seção "Decisões em aberto" do README da landing).
- `og-image.png` usa os assets reais de marca, mas a composição (headline + layout) ainda foi montada por script — se o time de design quiser uma arte de compartilhamento social dedicada, é uma melhoria futura, não um bloqueio.
- A lista de bots de IA bloqueados no `robots.txt` não é exaustiva nem permanente — novos user-agents de IA surgem com frequência; revisar periodicamente.
- Os arquivos originais em `docs/00-project/assets/` (alta resolução, fundo branco opaco) não foram alterados — o processamento (remoção de fundo, recorte, redimensionamento) gerou novos arquivos em `app/landing-page/src/assets/brand/` e `public/`, sem tocar nos originais entregues pelo design.

---

## Fora de escopo mantido

- Configuração de Google Search Console, Analytics ou qualquer ferramenta de terceiros
- Registro/configuração de domínio no Render.com

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add SEO meta tags, robots.txt and sitemap.xml`
2. `docs(tasks): add walkthrough and mark task 014 as developed`
3. `feat(landing): replace placeholder logo with real brand assets`
4. `docs(tasks): update walkthrough 014 with real brand assets and out-of-scope commit`

---

## Fechamento da entrega

### Branch

- `feat/014-landing-seo`

### Commits realizados

1. `8773f30` — `feat(landing): add SEO meta tags, robots.txt and sitemap.xml`
2. `4c5f4f9` — `docs(tasks): add walkthrough and mark task 014 as developed`
3. `6a060a3` — `Changing business plan and add assets` (commit externo, autoria de Daniel Buona — ver "Decisão 3" acima)
4. `4905d62` — `feat(landing): replace placeholder logo with real brand assets`

> **Atenção:** `git log origin/main..HEAD` mostra o commit `6a060a3`, que **não** foi feito nesta execução — é um commit externo que entrou na branch fora do controle desta sessão. Sinalizado ao responsável do projeto e mantido por decisão explícita dele (ver "Decisão 3" em "Decisões técnicas fora do prompt"). Os demais commits são desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/9
- **Título:** `feat(landing): SEO, meta tags e robots.txt`
- **Base:** `main`
- **Head:** `feat/014-landing-seo`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
