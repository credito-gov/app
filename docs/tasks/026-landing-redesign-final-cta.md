# Task 026 — Landing Page Redesign: CTA Final

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 025 merged **em `feat/landing-redesign`**
> **Estimativa:** 2-3h
> **Branch:** `feat/026-landing-redesign-final-cta` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 025 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/026-landing-redesign-final-cta
   ```
4. Task **12 de 13**. Depois desta, só falta o Footer (027).

---

## Contexto

O bloco de CTA final vira **seção própria** (Figma node `58:276`, "final-cta"), separado do FAQ (task 025). Ganha um subtítulo novo e um fundo com gradiente verde característico.

**Divergências vs. o CTA final atual:**
- Seção independente, não mais dentro de `FaqAndFinalCta.tsx`
- Fundo com gradiente verde radial + linear sobre `rgb(2,44,34)` — visual mais "hero-like" que antes
- **Novo subtítulo**: parágrafo explicativo que não existia
- Botão secundário: borda branca sólida (era borda cinza clara)

---

## Objetivo

Criar o componente `FinalCta` com título, subtítulo e dois botões, sobre fundo com gradiente verde.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/FinalCta.tsx` | Novo componente (extraído de `FaqAndFinalCta.tsx`) |
| `app/landing-page/src/App.tsx` | Atualizado — nesta task, `FaqAndFinalCta.tsx` (task 012) deve ser removido e substituído por `Faq` (025) + `FinalCta` (026) |
| `docs/tasks/walkthrough/026-landing-redesign-final-cta.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não deixar `FaqAndFinalCta.tsx` (arquivo antigo) órfão no repositório — remover depois que `Faq.tsx` e `FinalCta.tsx` estiverem ambos funcionando

---

## Detalhes técnicos — specs do Figma (node 58:276)

### Container

- `border-t-[rgba(4,120,87,0.5)]`, background: gradiente `linear-gradient(180deg, rgba(4,120,87,0.302) 0%, rgba(2,44,34,0) 100%)` sobre `rgb(2,44,34)` sólido
- `px-[64px] py-[96px]`, `gap-[32px]`, conteúdo centralizado

### Conteúdo

1. Título: "Descubra quanto crédito você tem parado hoje." — Inter Extra Bold, `40px`, branco, `tracking-[-0.8px]`, centralizado
2. **Subtítulo (novo)**: "Não deixe sua empresa perder dinheiro em planilhas fiscais antigas. Integração em segundos, resultados no primeiro dia." — Inter Regular, `16px`, cor `#94a3b8`, centralizado, largura `520px`
3. Botões (`gap-[16px]`):
   - Primário: `bg-[#10b981]`, `px-[32px] py-[14px]`, `rounded-[8px]`, texto Bold `15px` cor `#060a13` "Testar grátis por 14 dias"
   - Secundário: `border border-white` (sólida, branca — não mais cinza), mesmo padding/radius, texto Semi Bold `15px` branco "Falar com especialista" (sem "um" — atenção à mudança sutil de texto)

### Animação

- Título, subtítulo e botões: entrada escalonada com leve escala (90%→100%) — usar `.reveal-scale` com stagger curto entre os 3 blocos

---

## Passos sugeridos

1. Reabrir node `58:276` no Figma Desktop, confirmar specs
2. Criar `FinalCta.tsx`
3. Remover `FaqAndFinalCta.tsx` do repositório e do `App.tsx`, substituindo por `<Faq />` (025) + `<FinalCta />` (nesta task)
4. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] Título, subtítulo e os 2 botões com texto exato
- [ ] Fundo com gradiente verde visível
- [ ] `FaqAndFinalCta.tsx` removido, sem código morto
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/025-landing-redesign-faq.md`](025-landing-redesign-faq.md)
- Figma: node `58:276` ("final-cta")
