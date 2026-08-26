# Task 019 — Landing Page Redesign: Como Funciona (nova seção)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 018 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/019-landing-redesign-how-it-works` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 018 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/019-landing-redesign-how-it-works
   ```
4. Task **5 de 13**.

---

## Contexto

**Seção nova**, não existe na landing atual: "Como funciona a auditoria diária" (Figma node `58:99`, "how-it-works"). Explica o processo em 3 passos numerados.

---

## Objetivo

Criar o componente `HowItWorks` com cabeçalho (eyebrow + título + subtítulo) e grid de 3 passos numerados.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/HowItWorks.tsx` | Novo componente |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<HowItWorks />` na posição correta (após Prova Social) |
| `docs/tasks/walkthrough/019-landing-redesign-how-it-works.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não confundir com a seção "Dashboard Showcase" (task 020) — são seções diferentes e adjacentes
- ❌ Não usar os títulos "Sincronize → Descubra → Compense" (resumo conceitual informal) — usar o copy literal do Figma abaixo

---

## Detalhes técnicos — specs do Figma (node 58:99)

### Container

- `bg-[#f8fafc]` (fundo claro — contraste com as seções escuras ao redor), `px-[64px] py-[96px]`, `gap-[64px]`

### Cabeçalho

- Eyebrow: "Fluxo Automático" — `bg-[#ecfdf5]`, `border-[#a7f3d0]`, `rounded-full`, Inter Bold `11px` uppercase, cor `#047857`
- Título: "Como funciona a auditoria diária" — Inter Extra Bold, `36px`, cor `#060a13`, centralizado
- Subtítulo: "Uma apuração contínua e integrada que substitui processos retroativos demorados por dados em tempo real." — Inter Regular, `16px`, cor `#64748b`, centralizado, largura `520px`

### Grid de 3 passos (`gap-[32px]`, `flex-1` cada, alturas iguais — usar `items-stretch` no container, conforme já aprendido nas tasks 010/anteriores)

Cada card: `bg-white`, `border-[#e2e8f0]`, `rounded-[16px]`, `p-[32px]`, `gap-[24px]`

| # | Número | Título | Descrição |
|---|---|---|---|
| 1 | `01` (Inter Extra Bold, `32px`, cor `#10b981`) | Conexão e-CNPJ imediata | Com apenas uma autorização via e-CAC, nosso software sincroniza diretamente com a base da Receita Federal. |
| 2 | `02` | Auditoria contínua | Nosso motor de regras tributárias atualiza seus saldos de IBS/CBS diariamente, identificando desvios automaticamente. |
| 3 | `03` | Compensação rápida | Com os saldos validados, você abate guias de impostos ou solicita antecipação de caixa sem burocracia. |

Título de cada card: Inter Bold, `18px`, cor `#060a13`. Descrição: Inter Regular, `14px`, `leading-[1.5]`, cor `#64748b`.

### Animação

- Cabeçalho: `.reveal-up`
- 3 cards: `.reveal-scale` com stagger (~120ms entre cada), leve escala 85%→100%

---

## Passos sugeridos

1. Reabrir node `58:99` no Figma Desktop, confirmar specs
2. Criar `HowItWorks.tsx` com `.map()` sobre array local dos 3 passos
3. Inserir no `App.tsx` na posição correta (depois de `SocialProof`)
4. Aplicar `useScrollReveal`
5. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] 3 passos com números, títulos e descrições exatos do Figma
- [ ] Cards com altura igual entre si
- [ ] Fundo claro contrastando com as seções escuras adjacentes
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/018-landing-redesign-social-proof.md`](018-landing-redesign-social-proof.md)
- Figma: node `58:99` ("how-it-works")
