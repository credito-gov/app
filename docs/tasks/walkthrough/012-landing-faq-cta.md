# Walkthrough — Task 012 (Landing Page: FAQ + CTA Final)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Implementar o componente `FaqAndFinalCta` com o grid de FAQ (2 colunas, 4 perguntas) e o bloco de CTA final, fiel ao Figma (node `18:2`).

---

## O que foi entregue

### 1) Componente `FaqAndFinalCta`

Arquivo: `app/landing-page/src/components/FaqAndFinalCta.tsx`

- Título "Perguntas frequentes"
- Grid de 4 perguntas em 2 colunas fixas (array local dividido em duas listas, `.map()` por coluna) — sempre expandidas, sem interação de accordion
- Bloco de CTA final: título + botão primário verde + botão secundário vazado

### 2) Integração em `App.tsx`

- `<FaqAndFinalCta />` renderizado logo após `<Pricing />`

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu as specs do prompt da task 012 sem divergências.

---

## Validação executada

### Validação 1: `npm run lint`

- **Comando:** `npm run lint`
- **Saída resumida:** nenhuma saída (sem erros)
- **Conclusão:** ✅ passou

### Validação 2: `npm run build`

- **Comando:** `npm run build`
- **Saída resumida:**
  ```
  ✓ 28 modules transformed.
  dist/assets/index-*.css   15.15 kB
  ✓ built in 335ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: Estrutura (desktop, 1280x1000)

- **Comando:** inspeção via `querySelectorAll`/`getComputedStyle`
- **Saída resumida:** `{"gridDirection":"row","colCount":2,"questionsPerCol":[2,2],"finalCtaText":"Descubra quanto crédito você tem parado hoje."}`
- **Conclusão:** ✅ passou — 2 colunas com 2 perguntas cada, CTA final com o texto correto

### Validação 4: Mobile (390x900)

- **Comando:** viewport redimensionado, inspeção via `getComputedStyle`
- **Saída resumida:** `{"gridDirection":"column"}` — FAQ empilha em coluna única
- **Conclusão:** ✅ passou

> **Nota:** screenshot visual via browser pane apresentou instabilidade neste ambiente; validação foi feita via extração de texto/DOM e `getComputedStyle`, que confirmam estrutura e conteúdo corretos.

---

## Evidências visuais

- Estrutura DOM confirma 2 colunas × 2 perguntas no desktop, coluna única no mobile.
- Texto do CTA final e dos 4 pares pergunta/resposta conferem com a tabela da task.

---

## Pontos importantes para code review

- FAQ implementado como cards estáticos, sem `useState`/accordion — conforme confirmado na criação da task (o Figma mostra tudo sempre expandido).
- Botões do CTA final apontam para anchors placeholder, sem destino funcional ainda.

---

## Fora de escopo mantido

- Footer — task 013

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add FAQ + Final CTA section`
2. `docs(tasks): add walkthrough and mark task 012 as developed`

---

## Fechamento da entrega

### Branch

- `feat/012-landing-faq-cta`

### Commits realizados

1. `ee4c878` — `feat(landing): add FAQ + Final CTA section`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/7
- **Título:** `feat(landing): FAQ + CTA Final`
- **Base:** `main`
- **Head:** `feat/012-landing-faq-cta`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
