# Kanban — CreditoGov Tasks

> Fonte de verdade do status de desenvolvimento. Atualizar a cada mudança de estado.
> Se algo aqui divergir da realidade, a **task individual é a fonte de verdade** — reporte a divergência.

---

## Tabela de status

| # | Título | Branch | Pré-req | 1.Criado | 2.Revisado | 3.Desenv | 4.PR | 5.Merged | Notas |
|---|--------|--------|---------|----------|------------|----------|------|----------|-------|
| [001](001-backend-infra.md) | **Setup Backend**: Node.js + TypeScript + ESLint + docker-compose + CI | `feat/001-backend-infra` | — | ✅ | — | — | — | — | Sprint 1 |
| [002](002-database-migrations.md) | **TypeORM + Migrations + Seeders**: 4 tabelas + dados de teste | `feat/002-database-migrations` | 001 | ✅ | — | — | — | — | Sprint 1 |
| [003](003-auth-jwt-omie.md) | **Auth JWT**: login, refresh, logout, /auth/me | `feat/003-auth-jwt` | 002 | ✅ | — | — | — | — | Sprint 1 |
| [004](004-frontend-setup.md) | **Setup Frontend**: React + Vite + Tailwind + shadcn/ui + Redux + Router | `feat/004-frontend-setup` | 003 | ✅ | — | — | — | — | Sprint 2 |
| [005](005-layout-base.md) | **Layout Base**: Header + Sidebar + MainWrapper + tema + LoginPage | `feat/005-layout-base` | 004 | ✅ | — | — | — | — | Sprint 2 |
| [006](006-landing-page-architecture.md) | **Landing Page — Arquitetura**: stack, scaffold, Dockerfile, deploy Render.com | `feat/006-landing-page-arch` | — | ✅ | — | ✅ | ✅ [PR #1](https://github.com/credito-gov/app/pull/1) | ✅ | Landing Page 1 |
| [007](007-landing-header.md) | **Landing Page — Header (Navbar)**: logo, links, CTA, responsivo | `feat/007-landing-header` | 006 | ✅ | — | ✅ | ✅ [PR #2](https://github.com/credito-gov/app/pull/2) | ✅ | Landing Page 2 |
| [008](008-landing-hero.md) | **Landing Page — Hero Section**: tag, H1, CTAs, mockup de dashboard | `feat/008-landing-hero` | 007 | ✅ | — | ✅ | ✅ [PR #3](https://github.com/credito-gov/app/pull/3) | ✅ | Landing Page 3 |
| [009](009-landing-social-proof.md) | **Landing Page — Prova Social**: logos placeholder + 3 depoimentos | `feat/009-landing-social-proof` | 008 | ✅ | — | ✅ | ✅ [PR #4](https://github.com/credito-gov/app/pull/4) | ✅ | Landing Page 4 — inclui fix-forward de centralização + card Hero |
| [010](010-landing-problem-features.md) | **Landing Page — Dor vs Solução + Features**: 3 cards problema/solução + 3 cards de benefício | `feat/010-landing-problem-features` | 009 | ✅ | — | ✅ | ✅ [PR #5](https://github.com/credito-gov/app/pull/5) | ✅ | Landing Page 5 — inclui fix de altura igual entre cards |
| [011](011-landing-pricing.md) | **Landing Page — Preço**: card de plano único + garantia/bônus | `feat/011-landing-pricing` | 010 | ✅ | — | ✅ | ✅ [PR #6](https://github.com/credito-gov/app/pull/6) | ✅ | Landing Page 6 |
| [012](012-landing-faq-cta.md) | **Landing Page — FAQ + CTA Final**: 4 perguntas + bloco de CTA | `feat/012-landing-faq-cta` | 011 | ✅ | — | ✅ | ✅ [PR #7](https://github.com/credito-gov/app/pull/7) | ✅ | Landing Page 7 |
| [013](013-landing-footer.md) | **Landing Page — Footer**: 4 colunas + barra de copyright | `feat/013-landing-footer` | 012 | ✅ | — | ✅ | ✅ [PR #8](https://github.com/credito-gov/app/pull/8) | ✅ | Landing Page 8 |
| [014](014-landing-seo.md) | **Landing Page — SEO/Meta Tags + robots.txt**: OG/Twitter Card, sitemap, headings semânticos, bloqueio de bots de IA, logo real da marca | `feat/014-landing-seo` | 013 | ✅ | — | ✅ | ✅ [PR #9](https://github.com/credito-gov/app/pull/9) | ✅ | Landing Page 9 — última. Série completa! |
| [015](015-landing-redesign-motion-foundation.md) | **Redesign — Fundação de Motion**: hook `useScrollReveal` + design tokens dark mode | `feat/015-landing-redesign-motion` | 014 | ✅ | — | ✅ | ✅ [PR #11](https://github.com/credito-gov/app/pull/11) | — | Redesign 1/13 — PR contra `feat/landing-redesign`, não `main` |
| [016](016-landing-redesign-header.md) | **Redesign — Header/Nav**: dark, sticky com blur, novo item "Soluções" | `feat/016-landing-redesign-header` | 015 | ✅ | — | ✅ | ✅ [PR #12](https://github.com/credito-gov/app/pull/12) | — | Redesign 2/13 |
| [017](017-landing-redesign-hero.md) | **Redesign — Hero**: dark, copy novo, mockup "Painel Executivo" | `feat/017-landing-redesign-hero` | 016 | ✅ | — | ✅ | ✅ [PR #13](https://github.com/credito-gov/app/pull/13) | — | Redesign 3/13 |
| [018](018-landing-redesign-social-proof.md) | **Redesign — Prova Social**: dark, badges de empresa, sem depoimentos | `feat/018-landing-redesign-social-proof` | 017 | ✅ | — | ✅ | ✅ [PR #14](https://github.com/credito-gov/app/pull/14) | — | Redesign 4/13 |
| [019](019-landing-redesign-how-it-works.md) | **Redesign — Como Funciona** (seção nova): 3 passos numerados | `feat/019-landing-redesign-how-it-works` | 018 | ✅ | — | ✅ | ✅ [PR #15](https://github.com/credito-gov/app/pull/15) | — | Redesign 5/13 |
| [020](020-landing-redesign-dashboard-showcase.md) | **Redesign — Dashboard Showcase** (seção nova): tabela de transações | `feat/020-landing-redesign-dashboard-showcase` | 019 | ✅ | — | ✅ | ✅ [PR #16](https://github.com/credito-gov/app/pull/16) | — | Redesign 6/13 |
| [021](021-landing-redesign-features.md) | **Redesign — Features**: 3 ícones verdes uniformes, copy novo | `feat/021-landing-redesign-features` | 020 | ✅ | — | ✅ | ✅ [PR #17](https://github.com/credito-gov/app/pull/17) | — | Redesign 7/13 |
| [022](022-landing-redesign-metrics.md) | **Redesign — Métricas** (seção nova): R$4.2B / 1.840+ / 14 dias, animação bounce | `feat/022-landing-redesign-metrics` | 021 | ✅ | — | ✅ | ✅ [PR #18](https://github.com/credito-gov/app/pull/18) | — | Redesign 8/13 |
| [023](023-landing-redesign-testimonials.md) | **Redesign — Depoimentos**: seção própria, cards dark, bios atualizadas | `feat/023-landing-redesign-testimonials` | 022 | ✅ | — | ✅ | ✅ [PR #19](https://github.com/credito-gov/app/pull/19) | — | Redesign 9/13 |
| [024](024-landing-redesign-pricing.md) | **Redesign — Preço**: sem coluna lateral, "Sob Consulta" | `feat/024-landing-redesign-pricing` | 023 | ✅ | — | — | — | — | Redesign 10/13 |
| [025](025-landing-redesign-faq.md) | **Redesign — FAQ**: seção própria, dark, perguntas novas | `feat/025-landing-redesign-faq` | 024 | ✅ | — | — | — | — | Redesign 11/13 |
| [026](026-landing-redesign-final-cta.md) | **Redesign — CTA Final**: seção própria, gradiente verde, novo subtítulo | `feat/026-landing-redesign-final-cta` | 025 | ✅ | — | — | — | — | Redesign 12/13 |
| [027](027-landing-redesign-footer.md) | **Redesign — Footer**: colunas Produto/Soluções/Suporte, sem links legais | `feat/027-landing-redesign-footer` | 026 | ✅ | — | — | — | — | Redesign 13/13 — última; fecha com merge da PR centralizadora em `main` |

---

## Fila de execução

> Consulta rápida do "o que dá pra pegar agora". Atualizada a cada merge.

### 🟢 Disponíveis para iniciar

- [ ] **[001](001-backend-infra.md)** — Setup Backend _(4-6h; sem pré-req; primeira task)_

### 🔴 Bloqueadas por dependência

- [ ] **[002](002-database-migrations.md)** — aguarda 001 merged
- [ ] **[003](003-auth-jwt-omie.md)** — aguarda 002 merged
- [ ] **[004](004-frontend-setup.md)** — aguarda 003 merged
- [ ] **[005](005-layout-base.md)** — aguarda 004 merged
- [ ] **[016](016-landing-redesign-header.md)** — aguarda 015 merged em `feat/landing-redesign`
- [ ] **[017](017-landing-redesign-hero.md)** — aguarda 016 merged em `feat/landing-redesign`
- [ ] **[018](018-landing-redesign-social-proof.md)** — aguarda 017 merged em `feat/landing-redesign`
- [ ] **[019](019-landing-redesign-how-it-works.md)** — aguarda 018 merged em `feat/landing-redesign`
- [ ] **[020](020-landing-redesign-dashboard-showcase.md)** — aguarda 019 merged em `feat/landing-redesign`
- [ ] **[021](021-landing-redesign-features.md)** — aguarda 020 merged em `feat/landing-redesign`
- [ ] **[022](022-landing-redesign-metrics.md)** — aguarda 021 merged em `feat/landing-redesign`
- [ ] **[023](023-landing-redesign-testimonials.md)** — aguarda 022 merged em `feat/landing-redesign`
- [ ] **[024](024-landing-redesign-pricing.md)** — aguarda 023 merged em `feat/landing-redesign`
- [ ] **[025](025-landing-redesign-faq.md)** — aguarda 024 merged em `feat/landing-redesign`
- [ ] **[026](026-landing-redesign-final-cta.md)** — aguarda 025 merged em `feat/landing-redesign`
- [ ] **[027](027-landing-redesign-footer.md)** — aguarda 026 merged em `feat/landing-redesign`

### ⚠️ Nota — série do Redesign (015-027)

Essa série **não** segue o fluxo padrão "branch a partir de `main`, PR para `main`" do `AGENTS.md`. Existe uma branch de integração, `feat/landing-redesign` (criada a partir de `main`), com uma **PR centralizadora** aberta como rascunho contra `main`. Cada task 015-027 faz branch a partir de `feat/landing-redesign` e abre PR **de volta pra ela** — só a task 027 (última) fecha o ciclo promovendo a PR centralizadora para `main`. Decisão explícita do responsável do projeto, documentada na task 015.

### Como atualizar esta fila

- A cada task **merged**, mover ela para fora da lista Bloqueadas e promover as que desbloqueou
- Commit sugerido: `docs(tasks): update execution queue after task NNN merged`

---

## Convenções desta tabela

- **Branch**: nome sugerido. Pode ajustar se houver conflito.
- **Pré-req**: tasks que precisam estar **merged** antes que esta possa começar.
- **⚠️ Notas**: usar quando algo externo bloqueia.
- **Não excluir linhas** — tasks descartadas ficam com nota "❌ descartada — motivo".
- **Tasks novas**: incrementar o número (`006`, `007`...). Não reaproveitar números.

---

## Backlog — a definir

_(a ser preenchido após refinamento)_

---

Última atualização: **2026-08-26** (Tasks 015-027 criadas — série de redesign completo da landing, dark mode + 3 seções novas + motion, via branch de integração `feat/landing-redesign`)
