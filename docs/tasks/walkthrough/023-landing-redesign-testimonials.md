# Walkthrough — Task 023 (Redesign: Depoimentos)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar o componente `Testimonials` com cabeçalho + grid de 3 cards de depoimento, estilo dark, como seção própria (antes vivia dentro da Prova Social).

---

## O que foi entregue

### 1) `Testimonials.tsx`

- Cabeçalho: eyebrow "Feedback Real", título "O que dizem os nossos clientes"
- 3 cards dark (`#0e1524`), citações reescritas
- **3ª pessoa mudou de personagem**: era "Contadora — Escritório Contábil", agora "Diretora Tributária na Prado & Advogados" — copiado literalmente do Figma, não é erro
- Cada card entra de uma direção diferente: card 1 `.reveal-left`, card 2 `.reveal-up`, card 3 `.reveal-right`

### 2) Reaproveitamento de asset

- `avatar-placeholder.png` (task 009) reaproveitado nos 3 cards — mantido no repo desde a task 018 justamente para isso

### 3) Integração em `App.tsx`

- `<Testimonials />` renderizado logo após `<Metrics />`

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu exatamente as specs do prompt da task 023, incluindo o fallback de reaproveitar o avatar existente (a URL temporária do Figma para o avatar não foi verificada, já que o asset local já servia perfeitamente).

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e direções de entrada (desktop)

- **Comando:** `getComputedStyle`/`querySelectorAll`
- **Saída resumida:** `{"bg":"rgb(6, 10, 19)","title":"O que dizem os nossos clientes","cardCount":3,"names":["Fernanda Costa","Ricardo Nunes","Juliana Prado"],"revealClasses":["reveal-left","reveal-up","reveal-right"],"imgLoaded":[true,true,true]}`
- **Conclusão:** ✅ passou — fundo, título, os 3 nomes, as 3 direções de reveal e os 3 avatares carregando corretamente

---

## Evidências visuais

Inspeção de DOM/estilos computados confirma fundo, texto, avatares e classes de animação corretas.

---

## Pontos importantes para code review

- A mudança de profissão da 3ª pessoa (Contadora → Diretora Tributária) é intencional, copiada do Figma — não reverter para o texto antigo achando que é regressão.

---

## Fora de escopo mantido

- Preço, FAQ, CTA Final e Footer — tasks 024+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Testimonials section (redesign)`
2. `docs(tasks): add walkthrough and mark task 023 as developed`

---

## Fechamento da entrega

### Branch

- `feat/023-landing-redesign-testimonials` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `a3ec712` — `feat(landing): add Testimonials section (redesign)`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/19
- **Título:** `feat(landing): seção Depoimentos própria (redesign)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/023-landing-redesign-testimonials`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
