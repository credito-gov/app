# Walkthrough — Task 022 (Redesign: Métricas)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar o componente `Metrics` com 3 blocos de estatística (número grande + título + descrição), com fundo escuro gradiente e animação de escala elástica — a mais chamativa da página.

---

## O que foi entregue

### 1) `Metrics.tsx`

- 3 blocos (`.map()` sobre array local): R$ 4.2B / 1.840+ / 14 Dias, cada um com título e descrição
- Fundo com gradiente radial verde sutil via CSS puro, mesma técnica da Hero (task 017)
- Número: `.reveal-scale-bounce` (classe criada na task 015)
- Título + descrição: `.reveal-up`, com delay levemente maior que o número (entra logo depois)
- Stagger de 150ms entre os 3 blocos

### 2) Integração em `App.tsx`

- `<Metrics />` renderizado logo após `<Features />`

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu exatamente as specs do prompt da task 022, incluindo a nota sobre os números serem placeholders de exemplo (não dados reais de negócio).

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e cor (desktop)

- **Comando:** `querySelectorAll`/`getComputedStyle`
- **Saída resumida:** `{"numbers":["R$ 4.2B","1.840+","14 Dias"],"numberColor":"rgb(16, 185, 129)"}`
- **Conclusão:** ✅ passou

### Validação 3: efeito de escala elástica (o mais importante desta task)

- **Comando:** inspeção de `opacity`/`transform` antes e depois de `scrollIntoView`
- **Saída resumida:**
  - Antes (fora da viewport): `{"opacity":"0","transform":"matrix(0.5, 0, 0, 0.5, 0, 0)"}` (equivalente a `scale(0.5)`)
  - Depois (dentro da viewport): `{"opacity":"1","transform":"none","classList":"reveal-scale-bounce ... is-visible"}`
- **Conclusão:** ✅ passou — o efeito elástico dispara corretamente

---

## Evidências visuais

Inspeção de `opacity`/`transform` real no browser confirma o comportamento da animação antes/depois do scroll.

---

## Pontos importantes para code review

- Números (`R$ 4.2B`, `1.840+`) são placeholders de exemplo do Figma — **não são métricas reais de negócio**, já que a CreditoGov ainda não tem clientes em produção. Sinalizado no prompt original da task e reforçado aqui.
- O efeito de "bounce" usa `cubic-bezier(0.34, 1.56, 0.64, 1)` (definido na task 015) — vale conferir visualmente se a intensidade do efeito está agradável, já que é subjetivo.

---

## Fora de escopo mantido

- Depoimentos, Preço e demais seções — tasks 023+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Metrics section with bounce animation (redesign)`
2. `docs(tasks): add walkthrough and mark task 022 as developed`

---

## Fechamento da entrega

### Branch

- `feat/022-landing-redesign-metrics` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `5e3d529` — `feat(landing): add Metrics section with bounce animation (redesign)`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/18
- **Título:** `feat(landing): seção Métricas com animação bounce (nova, redesign)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/022-landing-redesign-metrics`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
