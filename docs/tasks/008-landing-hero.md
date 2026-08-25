# Task 008 — Landing Page: Hero Section (Abertura)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 007 merged
> **Estimativa:** 4-5h
> **Branch:** `feat/008-landing-hero`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 007 está **merged**.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/008-landing-hero
   ```
4. Esta é a task **3 da série Landing Page** (9 tasks ao todo: 006-014).

---

## Contexto

Logo abaixo do Header (task 007), a Hero Section é o primeiro bloco de conteúdo real da landing — duas colunas no desktop (texto + CTA à esquerda, mockup do dashboard à direita), uma coluna empilhada no mobile.

**Fonte do design:** especificações extraídas via Figma MCP (`get_design_context`) do node `15:36` ("2. Hero"), dentro de `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`.

---

## Objetivo

Implementar o componente `Hero` da landing page: coluna esquerda (tag, H1, parágrafo, CTAs, microcopy) e coluna direita (card de dashboard simulado com sombra, saldo, dois mini-cards e gráfico de linha), fiel ao Figma e responsivo.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Hero.tsx` | Componente da Hero Section |
| `app/landing-page/src/assets/hero-chart.svg` | Asset do gráfico de linha, baixado do Figma (ver "Assets" abaixo) |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<Hero />` logo após `<Header />` |
| `docs/tasks/walkthrough/008-landing-hero.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar Prova Social, Dor vs Solução, Features, Preço, FAQ ou Footer — tasks 009-013
- ❌ Não conectar os botões a nenhuma rota, formulário ou modal real — apenas visual, sem destino funcional ainda
- ❌ Não usar dados reais de crédito — os valores do mockup (R$ 274.335,18 etc.) são fixos, copiados do design
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma (node 15:36)

### Container da seção

| Propriedade | Valor |
|---|---|
| Background | `var(--neutral/bg-app, #f9fafb)` |
| Layout | `flex`, `items-center`, `gap-[56px]`, `w-full` (colunas lado a lado no desktop) |
| Padding | `pt-[72px] pb-[64px] px-[48px]` |
| Mobile (`< 768px`) | `flex-col`, gap reduzido (ex: `32px`), padding lateral menor (ex: `24px`) |

### Coluna esquerda (`flex-1`, `flex-col`, `gap-[20px]`, `items-start`)

**1. Pill/tag** — "Integrado à Receita Federal"
- `bg-[#ecfdf5]` (`var(--green/tint-bg)`), `border border-[#a7f3d0]` (`var(--green/border-positive)`)
- `flex items-center gap-[6px]`, `px-[10px] py-[5px]`, `rounded-full` (`var(--radius/999)`)
- Dot: círculo `6x6px` verde — **implementar como `<span>` circular simples** (`bg-green-500 rounded-full size-1.5`), não precisa de asset, é um dot de cor sólida
- Texto: Inter **Semi Bold**, `12px`, cor `var(--green/text-primary, #047857)`

**2. H1**
- "Pare de deixar crédito tributário parado na planilha."
- Inter **Semi Bold**, `46px`, `leading-[1.1]`, `tracking-[-1.38px]`, cor `var(--neutral/text-primary, #111827)`

**3. Parágrafo**
- "Sincronizamos com a Receita Federal todos os dias, mostramos exatamente quanto sua empresa tem de crédito de CBS/IBS e liberamos o caminho para compensar ou antecipar — sem depender de planilha."
- Inter **Regular**, `17px`, `leading-[1.55]`, cor `var(--neutral/body-text, #4b5563)`, largura máxima `480px`

**4. CTA Row** (`flex gap-[14px] items-start`)
- Botão primário: `bg-[#10b981]`, `px-[26px] py-[14px]`, `rounded-[6px]`, texto "Ver meus créditos em 14 dias grátis" — Inter **Semi Bold**, `15px`, branco
- Botão secundário (vazado): `bg-white`, `border border-[#d1d5db]` (`var(--neutral/border-input)`), `px-[26px] py-[14px]`, `rounded-[6px]`, texto "Agendar demonstração" — Inter **Semi Bold**, `15px`, cor `var(--neutral/button-text-secondary, #374151)`

**5. Microcopy**
- "Sem cartão de crédito. Sem contrato de fidelidade. Conecta pelo seu e-CNPJ."
- Inter **Regular**, `12.5px`, cor `var(--neutral/text-secondary, #6b7280)`

### Coluna direita — Card "Hero Right — Mockup" (`flex-1`)

| Propriedade | Valor |
|---|---|
| Background | branco |
| Borda | `1px solid var(--neutral/border-card, #e5e7eb)` |
| Border radius | `10px` (`var(--radius/10)`) |
| Sombra | `shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)]` (token "Shadow/Hero Mockup" no Figma) |

**Barra superior (estilo "janela")**
- `bg-[#f9fafb]`, `px-[14px] py-[10px]`, `flex gap-[6px] items-center`, `w-full`
- 3 círculos `9x9px` — mesmos dots de janela (macOS-style), **implementar como `<span>` circulares** com cor neutra clara, dispensa asset (são círculos sólidos sem detalhe vetorial)

**Conteúdo do mockup** (`flex-col gap-[14px]`, `p-[20px]`)
1. Saldo: "R$ 274.335,18" — Inter **Semi Bold**, `34px`, cor `#111827`
2. Duas colunas de mini-stat (`flex gap-[20px]`):
   - "Validados" (label `11px` Inter Regular cor `var(--green/text-primary, #047857)`) / "R$ 152.430" (`15px` Inter Semi Bold, `#111827`)
   - "Pendentes" (label `11px` Inter Regular cor `var(--amber/text, #b45309)`) / "R$ 121.905" (`15px` Inter Semi Bold, `#111827`)
3. Gráfico de linha: `360x90px` — **ver seção Assets abaixo**
4. Action Band: `bg-[#065f46]` (`var(--green/brand-panel)`), `flex items-center justify-between`, `px-[16px] py-[12px]`, `rounded-[8px]`, `w-full`
   - Texto: "Compensar R$ 50.000 de CBS/IBS" — Inter Semi Bold, `13px`, branco
   - Botão: `bg-[#10b981]`, `px-[12px] py-[6px]`, `rounded-[6px]`, texto "Compensar" — Inter Semi Bold, `12px`, branco

### Assets

O gráfico de linha (`imgFrame` no retorno do Figma MCP) é um SVG com desenho vetorial real — **precisa ser baixado e commitado**, não hotlinkado (a URL do Figma expira em ~7 dias). Baixe o asset do node `15:63` e salve em `app/landing-page/src/assets/hero-chart.svg`, referenciando via `import` no componente.

Os círculos sólidos (dot da pill, dots da barra de janela) **não** precisam de asset — são formas geométricas simples sem detalhe vetorial, reproduzíveis com `<span>`/`<div>` + Tailwind (`rounded-full` + cor).

---

## Passos sugeridos

1. Reabrir o node `15:36` no Figma Desktop (selecionar) e confirmar specs se houver dúvida
2. Baixar o asset do gráfico de linha e salvar em `app/landing-page/src/assets/hero-chart.svg`
3. Criar `app/landing-page/src/components/Hero.tsx` com a coluna esquerda
4. Implementar a coluna direita (card do mockup)
5. Compor as duas colunas em `flex` no desktop, `flex-col` no mobile
6. Importar e renderizar `<Hero />` em `App.tsx`, logo após `<Header />`
7. Testar visualmente em `npm run dev` — desktop e mobile, comparando com o screenshot do Figma
8. Criar o walkthrough em `docs/tasks/walkthrough/008-landing-hero.md` — **somente depois do PR aberto**
9. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 008
10. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] Layout de duas colunas no desktop, uma coluna empilhada no mobile (`< 768px`)
- [ ] Textos, cores, tipografia e espaçamentos conferem com o Figma (H1 `46px`, parágrafo `480px` de largura máx., etc.)
- [ ] Botão primário verde e botão secundário vazado lado a lado, com os textos exatos do design
- [ ] Card do mockup com sombra suave, saldo, dois mini-cards (Validados/Pendentes) e gráfico de linha visíveis
- [ ] `app/landing-page/src/assets/hero-chart.svg` commitado (não hotlink da URL do Figma)
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/008-landing-hero.md` criado com evidências reais (screenshots comparando com o Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 008

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/007-landing-header.md`](007-landing-header.md) — task anterior da série
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `15:36` ("2. Hero")
