# Task 024 — Landing Page Redesign: Preço

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 023 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/024-landing-redesign-pricing` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 023 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/024-landing-redesign-pricing
   ```
4. Task **10 de 13**.

---

## Contexto

Reescreve a seção de Preço (Figma node `58:234`, "pricing"). Simplifica bastante em relação à versão atual: **sem coluna lateral** (garantia/bônus), e a estratégia de preço muda de "placeholder numérico" para "Sob Consulta".

**Divergências vs. Preço atual (task 011):**
- Fundo `#f8fafc` (era branco puro)
- Eyebrow: "Preço Transparente" (era "PREÇO")
- Título: "Um único plano que cresce com a sua empresa" (era "Um plano só. Você paga mais quando recupera mais.")
- **Preço vira "Sob Consulta"** em vez de `R$ [valor]` — mudança de estratégia de apresentação, não só de texto
- Taxa de sucesso: "regressiva" (tiered/decrescente) em vez de percentual fixo `[x]%`
- **Coluna lateral (garantia + bônus de entrada) removida** — só sobra o card único, agora `560px` de largura, centralizado
- Lista de benefícios reduzida a 4 itens, sem ícone de bullet (texto puro)
- Botão: "Começar agora 14 dias grátis" (era "Começar os 14 dias grátis")

---

## Objetivo

Reescrever `Pricing.tsx`: card único centralizado, preço "Sob Consulta", sem coluna lateral.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Pricing.tsx` | Reescrito, mais simples que a versão anterior |
| `docs/tasks/walkthrough/024-landing-redesign-pricing.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não reimplementar a coluna lateral (garantia/bônus) — o redesign não tem
- ❌ Não inventar um valor numérico para o preço — "Sob Consulta" é a decisão do design, não um placeholder a preencher
- ❌ **Atenção:** isso pode ser interpretado como uma nova decisão de negócio (mudar de "preço explícito com taxa %" para "sob consulta") — se identificar qualquer sinal de que isso ainda não foi validado com o time de negócio, sinalizar no walkthrough, mas **seguir o Figma como está**, já que é o design oficial entregue

---

## Detalhes técnicos — specs do Figma (node 58:234)

### Container

- `bg-[#f8fafc]`, `px-[64px] py-[96px]`, `gap-[56px]`

### Cabeçalho

- Eyebrow: "Preço Transparente" — `bg-[#ecfdf5]`, `border-[#a7f3d0]`, cor `#047857`
- Título: "Um único plano que cresce com a sua empresa" — Inter Extra Bold, `36px`, cor `#060a13`, centralizado

### Card único (`w-[560px]`, centralizado)

- `bg-white`, `border-2 border-[#10b981]`, `rounded-[16px]`, `shadow-[0px_4px_12px_0px_rgba(16,185,129,0.12)]`, `overflow-hidden`
- Fita: `bg-[#ecfdf5]`, `px-[24px] py-[12px]` — texto "CREDITOGOV PRO" (Bold `12px`, cor `#059669`)
- Corpo (`p-[40px]`, `gap-[28px]`):
  1. Preço: "Sob Consulta" (Inter Extra Bold, `48px`, cor `#060a13`) + "/mês" (Regular `16px`, cor `#64748b`) — alinhados pela base (`items-baseline`)
  2. Nota: "+ taxa de sucesso regressiva sobre o crédito compensado ou antecipado no mês de apuração." (Regular `14px`, cor `#64748b`)
  3. Divisor horizontal
  4. Lista de 4 benefícios (texto puro, Semi Bold `14px`, cor `#060a13`, sem ícone de bullet):
     - Sincronização diária estruturada com e-CAC
     - Projeções completas para até 90 dias
     - Gestão ilimitada de e-CNPJs
     - Auditorias retroativas inclusas
  5. Botão: `bg-[#10b981]`, `p-[16px]`, `rounded-[8px]`, `w-full`, texto Bold `15px` cor `#060a13` (escuro sobre verde, mesma inversão da Hero) "Começar agora 14 dias grátis"

### Animação

- Cabeçalho: `.reveal-up`
- Card: `.reveal-scale` (85%→100%)

---

## Passos sugeridos

1. Reabrir node `58:234` no Figma Desktop, confirmar specs
2. Reescrever `Pricing.tsx`, removendo a coluna lateral e o array de benefícios com ícone de dot
3. Aplicar `useScrollReveal`
4. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] Card único, `560px`, centralizado, sem coluna lateral
- [ ] Preço "Sob Consulta", nota de taxa regressiva, 4 benefícios, botão com texto exato
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/023-landing-redesign-testimonials.md`](023-landing-redesign-testimonials.md)
- Figma: node `58:234` ("pricing")
