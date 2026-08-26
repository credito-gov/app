# Task 021 — Landing Page Redesign: Features

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 020 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/021-landing-redesign-features` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 020 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/021-landing-redesign-features
   ```
4. Task **7 de 13**.

---

## Contexto

Reescreve a seção Features (Figma node `58:164`, "key-features"). Estrutura de 3 cards se mantém, mas o copy, os ícones e a paleta mudam.

**Divergências vs. Features atual (task 010):**
- Eyebrow: "Vantagens Exclusivas" (era "O QUE VOCÊ GANHA")
- Título: "Três pilares de previsibilidade de caixa" (era "Três coisas que resolvem o mês inteiro")
- **Os 3 ícones agora são todos verdes** (badge sólido `#10b981`) — antes eram 2 verdes + 1 azul
- Cada card ganha um **divisor horizontal** + uma **tag final** abaixo dele (antes só tinha o texto "Você ganha: ...", sem divisor)
- Copy de título/descrição de cada card reescrito

---

## Objetivo

Reescrever `Features.tsx` com o novo copy, ícones uniformemente verdes, e o divisor + tag final por card.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Features.tsx` | Reescrito |
| `app/landing-page/src/assets/icon-check-circle.svg` | Ícone novo (check-circle), baixado do Figma — os 3 cards agora usam o mesmo ícone |
| `docs/tasks/walkthrough/021-landing-redesign-features.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não reaproveitar os 3 ícones antigos (`icon-feature-sync.svg`, etc.) — o redesign usa um único ícone (check-circle) repetido nos 3 cards
- ❌ Não manter a cor azul em nenhum dos cards — os 3 são verdes agora

---

## Detalhes técnicos — specs do Figma (node 58:164)

### Container

- `bg-white`, `px-[64px] py-[96px]`, `gap-[56px]`

### Cabeçalho

- Eyebrow: "Vantagens Exclusivas" — `bg-[#ecfdf5]`, `border-[#a7f3d0]`, cor `#047857`
- Título: "Três pilares de previsibilidade de caixa" — Inter Extra Bold, `36px`, cor `#060a13`, centralizado

### Grid de 3 cards (`gap-[24px]`, alturas iguais via `items-stretch`)

Cada card: `bg-[#f8fafc]`, `border-[#e2e8f0]`, `rounded-[16px]`, `p-[32px]`, `gap-[20px]`

- Badge do ícone: `bg-[#10b981]` sólido, `rounded-[8px]`, `size-[40px]`, ícone check-circle `20px` branco dentro — **igual nos 3 cards**
- Título: Inter Extra Bold, `20px`, cor `#060a13`
- Descrição: Inter Regular, `14px`, `leading-[1.6]`, cor `#64748b`
- Divisor: linha horizontal `1px`, full width
- Tag final: Inter Bold, `13px`, cor `#059669`

| # | Título | Descrição | Tag final |
|---|---|---|---|
| 1 | Sincronização diária | Varremos notas fiscais emitidas contra o seu CNPJ na virada do dia para garantir que nenhum centavo de crédito seja esquecido. | Previsão sem esforço |
| 2 | Projeção de 90 dias | Antecipe o que está programado para entrar no seu caixa e otimize o planejamento orçamentário da empresa de forma visual. | Fluxo sob controle |
| 3 | Dois cliques para liquidar | Abata débitos tributários diretamente com os saldos validados ou solicite a antecipação imediata com taxas reduzidas. | Crédito vira dinheiro |

### Assets

Baixar o ícone check-circle (usado nos 3 cards) do Figma e salvar em `app/landing-page/src/assets/icon-check-circle.svg` — commitado, não hotlink.

### Animação

- 3 cards: `.reveal-up` com stagger (~100ms)

---

## Passos sugeridos

1. Reabrir node `58:164` no Figma Desktop, confirmar specs
2. Baixar o ícone check-circle
3. Reescrever `Features.tsx` com o novo copy e paleta uniforme
4. Aplicar `useScrollReveal`
5. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] 3 cards com o mesmo ícone/cor verde, copy exato da tabela
- [ ] Divisor + tag final presentes em cada card
- [ ] Cards com altura igual
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/020-landing-redesign-dashboard-showcase.md`](020-landing-redesign-dashboard-showcase.md)
- Figma: node `58:164` ("key-features")
