# Walkthrough — Task 019 (Redesign: Como Funciona)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar o componente `HowItWorks` com cabeçalho (eyebrow + título + subtítulo) e grid de 3 passos numerados — seção nova, não existia na landing atual.

---

## O que foi entregue

### 1) `HowItWorks.tsx`

- Cabeçalho: eyebrow "Fluxo Automático", título "Como funciona a auditoria diária", subtítulo
- Grid de 3 passos numerados (01/02/03), `.map()` sobre array local
- Fundo `#f8fafc`, cards com altura igual (`items-stretch`, padrão já usado desde a task 010)
- Animação `.reveal-scale` com stagger de 120ms entre os cards

### 2) Integração em `App.tsx`

- `<HowItWorks />` renderizado logo após `<SocialProof />`

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu exatamente as specs do prompt da task 019.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estrutura (desktop, 1280x1000)

- **Comando:** `getComputedStyle`/`querySelectorAll`
- **Saída resumida:** `{"bg":"rgb(248, 250, 252)","title":"Como funciona a auditoria diária","steps":[{"number":"01","title":"Conexão e-CNPJ imediata"},{"number":"02","title":"Auditoria contínua"},{"number":"03","title":"Compensação rápida"}]}`
- **Conclusão:** ✅ passou

### Validação 3: alturas iguais entre os cards

- **Comando:** `getBoundingClientRect().height` de cada card
- **Saída resumida:** `[212.4, 212.4, 212.4]` — idênticas
- **Conclusão:** ✅ passou

---

## Evidências visuais

Inspeção de DOM/estilos computados confirma fundo, texto e alturas exatas.

---

## Pontos importantes para code review

- Nenhum ponto de atenção especial — task direta, sem divergências do Figma.

---

## Fora de escopo mantido

- Dashboard Showcase, Métricas e demais seções — tasks 020+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add How It Works section (redesign)`
2. `docs(tasks): add walkthrough and mark task 019 as developed`

---

## Fechamento da entrega

### Branch

- `feat/019-landing-redesign-how-it-works` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `6619007` — `feat(landing): add How It Works section (redesign)`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/15
- **Título:** `feat(landing): seção Como Funciona (nova, redesign)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/019-landing-redesign-how-it-works`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
