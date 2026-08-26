# Walkthrough — Task 021 (Redesign: Features)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Reescrever `Features.tsx` com o novo copy, ícones uniformemente verdes, e o divisor + tag final por card.

---

## O que foi entregue

### 1) `Features.tsx` reescrito

- Eyebrow "Vantagens Exclusivas", título "Três pilares de previsibilidade de caixa"
- 3 cards com o mesmo ícone (check-circle) sobre badge verde sólido `#10b981`
- Copy novo por card (título, descrição, tag final)
- Divisor horizontal + tag final em cada card

### 2) Asset novo

- `icon-check-circle.svg` baixado do Figma (stroke branco, pronto para uso sobre fundo verde sólido)

### 3) Limpeza

- `icon-feature-sync.svg`, `icon-feature-projection.svg`, `icon-feature-actions.svg` removidos — órfãos após a padronização dos ícones

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu exatamente as specs do prompt da task 021.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: cores e conteúdo (desktop, 1280 largura)

- **Comando:** `getComputedStyle`/`querySelectorAll`
- **Saída resumida:** `{"title":"Três pilares de previsibilidade de caixa","cardCount":3,"badgeBg":["rgb(16, 185, 129)","rgb(16, 185, 129)","rgb(16, 185, 129)"],"titles":["Sincronização diária","Projeção de 90 dias","Dois cliques para liquidar"],"hasHr":[true,true,true]}`
- **Conclusão:** ✅ passou — 3 badges com a mesma cor verde, divisor presente em todos

### Validação 3: alturas dos cards e carregamento do ícone

- **Comando:** `getBoundingClientRect().height` + `img.complete/naturalWidth`
- **Saída resumida:** `{"heights":[318.06,318.06,318.06],"imgLoaded":true}`
- **Conclusão:** ✅ passou

---

## Evidências visuais

Inspeção de DOM/estilos computados confirma cores, texto e alturas exatas.

---

## Pontos importantes para code review

- Nenhum ponto de atenção especial — task direta, sem divergências do Figma.

---

## Fora de escopo mantido

- Métricas, Depoimentos e demais seções — tasks 022+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): redesign Features with uniform green icons`
2. `docs(tasks): add walkthrough and mark task 021 as developed`

---

## Fechamento da entrega

### Branch

- `feat/021-landing-redesign-features` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `92f700e` — `feat(landing): redesign Features with uniform green icons`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/17
- **Título:** `feat(landing): redesign Features (ícones verdes uniformes)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/021-landing-redesign-features`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
