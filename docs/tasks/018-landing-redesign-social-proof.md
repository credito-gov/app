# Task 018 — Landing Page Redesign: Prova Social

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 017 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/018-landing-redesign-social-proof` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 017 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/018-landing-redesign-social-proof
   ```
4. Task **4 de 13**.

---

## Contexto

Reescreve `SocialProof.tsx` (Figma node `58:86`, "social-proof"). No redesign, essa seção **perde os depoimentos** — eles viram uma seção própria (task 023, "testimonials"). Sobra só o texto de contexto + fileira de logos, agora com nomes de empresa em vez de slots vazios.

**Divergências vs. a Prova Social atual:**
- Fundo escuro `#0e1524`, borda superior e inferior `#1e293b` (era branco, só borda inferior)
- Texto: "Mais de 1.840 empresas conectadas no Brasil" (era "USADO POR EMPRESAS QUE JÁ RECUPERARAM MILHÕES EM CRÉDITO")
- Logos: **badges com nome de empresa** (texto), não mais caixas tracejadas vazias
- **Depoimentos saem desta seção** — viram a task 023

---

## Objetivo

Reescrever `SocialProof.tsx`: texto de contexto + fileira de 5 badges de empresa, sem depoimentos.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/SocialProof.tsx` | Reescrito: dark, badges de empresa, sem depoimentos |
| `docs/tasks/walkthrough/018-landing-redesign-social-proof.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar depoimentos aqui — isso é a task 023
- ❌ Não usar nomes de empresas reais — os 5 nomes do Figma (AURORA, GLOBAL LOG, VALE INDÚSTRIA, MATO GROSSO AGRO, C-FINANCE) são fictícios/placeholder, manter como estão

---

## Detalhes técnicos — specs do Figma (node 58:86)

### Container

- `bg-[#0e1524]`, `border-y-[#1e293b]`, `px-[64px] py-[48px]`, `gap-[24px]`

### Texto de contexto

- "Mais de 1.840 empresas conectadas no Brasil" — Inter Bold, `12px`, **uppercase**, cor `#64748b`, centralizado

### Fileira de logos (badges)

- Container: `justify-between`, `w-full`
- Cada badge: `border-[#1e293b]`, `rounded-[8px]`, `px-[16px] py-[8px]`, texto Inter **Extra Bold**, `14px`, cor `#94a3b8`
- Nomes, nesta ordem: **AURORA**, **GLOBAL LOG**, **VALE INDÚSTRIA**, **MATO GROSSO AGRO**, **C-FINANCE** (5 empresas, não 6 slots como antes)

### Animação

- Texto + fileira de logos: `.reveal-up`, delay leve entre os dois blocos

---

## Passos sugeridos

1. Reabrir node `58:86` no Figma Desktop, confirmar specs
2. Reescrever `SocialProof.tsx`: remover a lógica de slots tracejados e o grid de depoimentos
3. Implementar os 5 badges de empresa com `.map()` sobre array local
4. Aplicar `useScrollReveal`
5. Testar `npm run dev`, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] Fundo escuro, texto e 5 badges de empresa corretos
- [ ] Nenhum depoimento presente nesta seção
- [ ] Responsivo (badges quebram/empilham em mobile de forma razoável)
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/017-landing-redesign-hero.md`](017-landing-redesign-hero.md)
- Figma: node `58:86` ("social-proof")
