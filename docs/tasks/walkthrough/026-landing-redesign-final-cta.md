# Walkthrough — Task 026 (Redesign: CTA Final)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar o componente `FinalCta` como seção própria (extraída do antigo `FaqAndFinalCta.tsx`), com gradiente verde escuro, novo copy e dois CTAs, e remover o arquivo antigo órfão.

---

## O que foi entregue

### 1) `FinalCta.tsx`

- Fundo `linear-gradient(180deg, rgba(4,120,87,0.302) 0%, rgba(2,44,34,0) 100%)` sobre `rgb(2,44,34)`
- Título "Descubra quanto crédito você tem parado hoje." (40px, extrabold, branco)
- Novo subtítulo: "Não deixe sua empresa perder dinheiro em planilhas fiscais antigas. Integração em segundos, resultados no primeiro dia." (16px, `#94a3b8`)
- Dois botões: "Testar grátis por 14 dias" (primário, verde `#10b981`, texto escuro) e "Falar com especialista" (secundário, borda branca)
- Animação `reveal-scale` com `transitionDelay` escalonado entre título/subtítulo/botões

### 2) `App.tsx`

- `<FinalCta />` adicionado depois de `<Faq />`

### 3) Remoção

- `FaqAndFinalCta.tsx` (órfão desde a task 025) excluído do repositório

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estrutura (dev server + inspeção DOM)

- **Comando:** `getComputedStyle`/`querySelectorAll` no último `<section>` da página
- **Saída resumida:** `{"t":"Descubra quanto crédito você tem parado hoje.","sub":"Não deixe sua empresa perder dinheiro em planilhas fiscais antigas. Integração em segundos, resultados no primeiro dia.","btns":["Testar grátis por 14 dias","Falar com especialista"],"bgSnippet":"linear-gradient(rgba(4, 120, 87, 0.3) 0%, rgba(2, 44, 34, 0) 100%), none"}`
- **Conclusão:** ✅ passou — título, subtítulo, botões e gradiente conferem com o spec

---

## Pontos importantes para code review

- `FaqAndFinalCta.tsx` removido nesta task, conforme previsto no prompt da task 025.

---

## Fora de escopo mantido

- Footer — task 027 (última da série, também promove a PR centralizadora para `main`)

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add standalone FinalCta section (redesign)`
2. `docs(tasks): add walkthrough and mark task 026 as developed`

---

## Fechamento da entrega

### Branch

- `feat/026-landing-redesign-final-cta` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `d594eb5` — `feat(landing): add standalone FinalCta section (redesign)`

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/22
- **Título:** `feat(landing): seção CTA Final própria (redesign)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/026-landing-redesign-final-cta`
