# Walkthrough — Task 018 (Redesign: Prova Social)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Reescrever `SocialProof.tsx`: texto de contexto + fileira de 5 badges de empresa, sem depoimentos.

---

## O que foi entregue

### 1) `SocialProof.tsx` reescrito

- Fundo `#0e1524`, `border-y-[#1e293b]`
- Texto "Mais de 1.840 empresas conectadas no Brasil"
- 5 badges de empresa (`.map()` sobre array local): AURORA, GLOBAL LOG, VALE INDÚSTRIA, MATO GROSSO AGRO, C-FINANCE
- Depoimentos removidos (movidos conceitualmente para a task 023)
- Animação via `useScrollReveal`, usando a convenção de destructuring nomeado recomendada na task 017 (`ref: textRef`, `ref: logosRef`)

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu exatamente as specs do prompt da task 018.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estrutura (browser)

- **Comando:** inspeção via `getComputedStyle`/`querySelectorAll` em `npm run dev`
- **Saída resumida:** `{"bg":"rgb(14, 21, 36)","text":"Mais de 1.840 empresas conectadas no Brasil","companies":["AURORA","GLOBAL LOG","VALE INDÚSTRIA","MATO GROSSO AGRO","C-FINANCE"],"noTestimonials":true}`
- **Conclusão:** ✅ passou — fundo, texto, 5 badges e ausência de depoimentos confirmados

---

## Evidências visuais

Inspeção de `getComputedStyle`/DOM confirma fundo dark (`rgb(14, 21, 36)` = `#0e1524`) e conteúdo exato.

---

## Pontos importantes para code review

- `avatar-placeholder.png` (task 009) **não foi removido** — fica disponível para a task 023 reaproveitar nos depoimentos, conforme previsto no próprio prompt da task 018.

---

## Fora de escopo mantido

- Depoimentos — task 023
- Demais seções — tasks 019+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): redesign Social Proof to dark with company badges`
2. `docs(tasks): add walkthrough and mark task 018 as developed`

---

## Fechamento da entrega

### Branch

- `feat/018-landing-redesign-social-proof` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `372714b` — `feat(landing): redesign Social Proof to dark with company badges`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/14
- **Título:** `feat(landing): redesign Prova Social (dark, badges de empresa)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/018-landing-redesign-social-proof`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
