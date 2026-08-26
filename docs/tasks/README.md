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
| [012](012-landing-faq-cta.md) | **Landing Page — FAQ + CTA Final**: 4 perguntas + bloco de CTA | `feat/012-landing-faq-cta` | 011 | ✅ | — | ✅ | ✅ [PR #7](https://github.com/credito-gov/app/pull/7) | — | Landing Page 7 |
| [013](013-landing-footer.md) | **Landing Page — Footer**: 4 colunas + barra de copyright | `feat/013-landing-footer` | 012 | ✅ | — | — | — | — | Landing Page 8 |
| [014](014-landing-seo.md) | **Landing Page — SEO/Meta Tags + robots.txt**: OG/Twitter Card, sitemap, headings semânticos, bloqueio de bots de IA | `feat/014-landing-seo` | 013 | ✅ | — | — | — | — | Landing Page 9 — última |

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
- [ ] **[013](013-landing-footer.md)** — aguarda 012 merged
- [ ] **[014](014-landing-seo.md)** — aguarda 013 merged

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

Última atualização: **2026-08-25** (Tasks 006-014 criadas — série completa da Landing Page, do scaffold ao SEO)
