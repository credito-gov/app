# Task 017 — Landing Page Redesign: Hero

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 016 merged **em `feat/landing-redesign`**
> **Estimativa:** 5-6h
> **Branch:** `feat/017-landing-redesign-hero` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 016 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/017-landing-redesign-hero
   ```
4. Task **3 de 13**. Reaproveite `useScrollReveal` (task 015).

---

## Contexto

Reescreve `Hero.tsx` para o visual dark do redesign (Figma node `58:43`, "hero-section"). Mesma estrutura de 2 colunas, mas copy novo, cores dark, mockup mais detalhado ("Painel Executivo").

**Divergências vs. a Hero atual:**
- Fundo escuro com gradiente radial sutil verde (era `#f9fafb` claro)
- H1 `48px` Extra Bold (era `46px` Semi Bold)
- Parágrafo reescrito
- CTA primário com **texto escuro sobre fundo verde** (inversão de contraste vs. antes)
- Microcopy reescrita, com separador `·`
- Mockup: header da janela ganha label "PAINEL EXECUTIVO"; saldo com label mais longa; cards Validado/Pendente com estilo dark tintado; Action Pill com subtítulo de vencimento e botão invertido (branco com texto verde)

---

## Objetivo

Reescrever `Hero.tsx` fiel ao redesign: coluna esquerda (eyebrow, H1, parágrafo, CTAs, microcopy) e coluna direita (mockup "Painel Executivo"), com animações de entrada via `useScrollReveal`.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Hero.tsx` | Reescrito para o visual dark do redesign |
| `docs/tasks/walkthrough/017-landing-redesign-hero.md` | **Obrigatório**, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não mexer nas demais seções
- ❌ Não implementar o gráfico com precisão vetorial pixel-perfect se o asset não puder ser baixado — usar o SVG existente (`hero-chart.svg`, task 008) redimensionado/recolorido é aceitável; sinalizar no walkthrough se divergir do vetor exato do Figma

---

## Detalhes técnicos — specs do Figma (node 58:43)

### Container da seção

- `background`: gradiente radial sutil verde (`rgba(4,120,87,0.15)` fade) sobre `#060a13` sólido
- `padding`: `pt-[88px] pb-[96px] px-[64px]`, `gap-[40px]` entre colunas (era 56px)

### Coluna esquerda

1. **Eyebrow**: "Integrado à Receita Federal" — `bg-[rgba(4,120,87,0.15)]`, `border-[rgba(4,120,87,0.5)]`, `rounded-full`, texto Inter Bold `11px` **uppercase**, cor `#10b981`
2. **H1**: "Pare de deixar crédito tributário parado na planilha." — Inter **Extra Bold**, `48px`, `leading-[1.15]`, `tracking-[-1.44px]`, branco
3. **Parágrafo** (novo copy): "Sincronizamos com a Receita Federal todos os dias para revelar impostos pagos a maior de CBS e IBS prontos para compensação ou antecipação financeira." — Inter Regular, `16px`, `leading-[1.6]`, cor `#94a3b8`, largura `480px`
4. **CTAs**:
   - Primário: `bg-[#10b981]`, `px-[28px] py-[14px]`, `rounded-[8px]`, texto Inter Bold `15px` cor `#060a13` (escuro — inversão!) "Ver meus créditos em 14 dias grátis"
   - Secundário: `bg-[rgba(255,255,255,0.02)]`, `border-[#1e293b]`, mesmo padding/radius, texto Inter Semi Bold `15px` branco "Agendar demonstração"
5. **Microcopy**: "Sem cartão de crédito · Sem fidelidade · Integração imediata via e-CNPJ" — Inter Regular `12px`, cor `#64748b`

### Coluna direita — mockup "Painel Executivo"

- Card: `bg-[#0e1524]`, `border-[#1e293b]`, `rounded-[16px]`, `shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)]`
- **Header da janela**: `bg-[#0c121e]`, border-bottom `#1e293b`, 3 dots `8px`, e label à direita **"PAINEL EXECUTIVO"** (novo) — Inter Semi Bold `11px`, cor `#64748b`
- **Corpo** (`p-[28px]`, `gap-[20px]`):
  1. Label "SALDO DE CRÉDITOS DISPONÍVEIS" (Inter Bold `11px`, `#64748b`) + valor "R$ 274.335,18" (Inter Extra Bold `38px`, branco)
  2. Cards lado a lado (`gap-[16px]`):
     - **Validado**: `bg-[rgba(5,150,105,0.08)]`, `border-[rgba(5,150,105,0.2)]`, `rounded-[8px]`, `p-[16px]` — label "Validado" (Semi Bold `12px`, `#10b981`) + valor "R$ 152.430" (Bold `18px`, branco)
     - **Pendente**: `bg-[rgba(217,119,6,0.08)]`, `border-[rgba(217,119,6,0.2)]` — dot `14px` + label "Pendente" (Semi Bold `12px`, `#fbbf24`) + valor "R$ 121.905" (Bold `18px`, branco)
  3. Gráfico de linha com área preenchida — reaproveitar `hero-chart.svg` (task 008/009), recolorido pro tema dark se necessário (linha/área verde sobre fundo escuro já funciona)
  4. **Action Pill**: `bg-[#047857]`, `rounded-[12px]`, `p-[16px]`, `justify-between`
     - Texto: "Compensar R$ 50.000 de CBS/IBS" (Bold `13px` branco) + subtítulo "Vencimento próximo em 20/01" (Regular `11px`, `rgba(255,255,255,0.8)`)
     - Botão: `bg-white`, `px-[16px] py-[8px]`, `rounded-[6px]`, texto Bold `12px` cor `#047857` "Compensar" (**invertido**: fundo branco, texto verde — era o oposto antes)

### Animação (scroll-reveal)

- Coluna esquerda: itens entram escalonados da esquerda (`.reveal-left`), delay incremental ~120ms entre eyebrow/H1/parágrafo/CTAs/microcopy
- Mockup: `.reveal-right` combinado com leve escala (90% → 100%) — usar `.reveal-scale` ou uma combinação (uma pequena classe adicional pode ser criada se necessário, documentar no walkthrough)

---

## Passos sugeridos

1. Reabrir node `58:43` no Figma Desktop, confirmar specs
2. Reescrever a coluna esquerda com o novo copy e estilos
3. Reescrever o mockup da coluna direita
4. Aplicar `useScrollReveal` conforme mapeamento acima
5. Testar `npm run dev` — desktop e mobile, scroll para conferir animação
6. Walkthrough **depois do PR**
7. Atualizar kanban, sincronizar com `origin/feat/landing-redesign`, abrir PR **contra `feat/landing-redesign`**

---

## Critérios de validação

- [ ] Copy exato do redesign (H1, parágrafo, microcopy, textos do mockup)
- [ ] CTA primário com texto escuro sobre fundo verde (contraste invertido corretamente)
- [ ] Mockup com label "PAINEL EXECUTIVO", cards Validado/Pendente com tint dark, Action Pill com subtítulo de vencimento e botão invertido
- [ ] Animação de entrada visível ao rolar até a seção
- [ ] `npm run build` sem erros
- [ ] PR aberto antes do walkthrough; kanban atualizado

---

## Referências

- [`docs/tasks/016-landing-redesign-header.md`](016-landing-redesign-header.md)
- Figma: node `58:43` ("hero-section")
