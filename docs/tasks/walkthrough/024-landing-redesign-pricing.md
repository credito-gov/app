# Walkthrough — Task 024 (Redesign: Preço)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Reescrever `Pricing.tsx`: card único centralizado, preço "Sob Consulta", sem coluna lateral.

---

## O que foi entregue

### 1) `Pricing.tsx` reescrito

- Eyebrow "Preço Transparente", título "Um único plano que cresce com a sua empresa"
- Card único (`max-w-[560px]`, centralizado), **sem** a coluna lateral de garantia/bônus
- Preço "Sob Consulta" (não é mais um placeholder numérico) + nota de taxa "regressiva"
- 4 benefícios em texto puro, sem ícone de bullet
- Botão "Começar agora 14 dias grátis"

---

## Decisões técnicas fora do prompt

Nenhuma. O prompt da task já alertava explicitamente sobre a mudança "Sob Consulta" vs. placeholder numérico como decisão do design a ser seguida como está — não é uma decisão nova desta execução.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estrutura (desktop)

- **Comando:** `getComputedStyle`/`querySelectorAll`
- **Saída resumida:** `{"title":"Um único plano que cresce com a sua empresa","cardWidth":504,"price":true,"benefits":["Sincronização diária estruturada com e-CAC","Projeções completas para até 90 dias","Gestão ilimitada de e-CNPJs","Auditorias retroativas inclusas"],"noSideColumn":true}`
- **Conclusão:** ✅ passou — título, "Sob Consulta", os 4 benefícios exatos e confirmação de que só existem 2 filhos no container (título + card, sem coluna lateral)

---

## Evidências visuais

Inspeção de DOM/estilos computados confirma estrutura sem coluna lateral e conteúdo exato.

---

## Pontos importantes para code review

- "Sob Consulta" substitui o placeholder `R$ [valor]` que existia antes — é uma mudança de estratégia de apresentação do preço vinda do próprio design, não uma decisão de código.

---

## Fora de escopo mantido

- FAQ, CTA Final e Footer — tasks 025+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): redesign Pricing without side column, "Sob Consulta"`
2. `docs(tasks): add walkthrough and mark task 024 as developed`

---

## Fechamento da entrega

### Branch

- `feat/024-landing-redesign-pricing` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `bb0cb84` — `feat(landing): redesign Pricing without side column, "Sob Consulta"`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/20
- **Título:** `feat(landing): redesign Preço (sem coluna lateral, Sob Consulta)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/024-landing-redesign-pricing`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
