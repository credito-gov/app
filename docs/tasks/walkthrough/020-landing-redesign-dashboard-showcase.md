# Walkthrough — Task 020 (Redesign: Dashboard Showcase)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar o componente `DashboardShowcase` com cabeçalho + card de tabela (header + linhas de transação fictícias) — seção nova.

---

## O que foi entregue

### 1) `DashboardShowcase.tsx`

- Cabeçalho: eyebrow "Painel de Controle", título, subtítulo
- Card com header "Transações de Crédito Recentes" + tabela com 4 linhas (`.map()` sobre array local)
- Badge "Pendente" renderizado condicionalmente, só quando `tx.status` existe (só a linha de Setembro/2025)
- Tabela envolvida em `overflow-x-auto` com `min-w-[720px]` interno, para não estourar a largura da página em mobile
- Animação via `useScrollReveal`

### 2) Integração em `App.tsx`

- `<DashboardShowcase />` renderizado logo após `<HowItWorks />`

---

## Decisões técnicas fora do prompt

### Decisão 1: simplificação da animação de entrada da tabela

- **Contexto:** o Figma descreve um efeito de "6 painéis entrando com rotação alternada". O prompt da task já antecipava essa simplificação como aceitável, para não gerar layout thrashing em uma tabela real.
- **Alternativa escolhida:** `.reveal-up` simples no card inteiro da tabela, com leve delay em relação ao cabeçalho.
- **Sinalizado antes da execução:** ❌ Não necessário — já estava pré-aprovado no prompt da própria task.
- **Impacto:** nenhum negativo, conforme já esperado.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estrutura (desktop, 1280x1000)

- **Comando:** `getComputedStyle`/`querySelectorAll`
- **Saída resumida:** `{"bg":"rgb(6, 10, 19)","title":"Seus créditos estruturados e sob controle","rowCount":4,"rows":[{"period":"Novembro/2025","amount":"R$ 48.910,22","hasStatus":""},{"period":"Outubro/2025","amount":"R$ 104.312,18","hasStatus":""},{"period":"Setembro/2025","amount":"R$ 12.435,00","hasStatus":"Pendente"},{"period":"Agosto/2025","amount":"R$ 108.677,78","hasStatus":""}]}`
- **Conclusão:** ✅ passou — 4 linhas exatas, badge só na linha certa

### Validação 3: responsividade da tabela em mobile (390x844)

- **Comando:** inspeção de `scrollWidth`/`clientWidth`
- **Saída resumida:** `{"bodyScrollWidth":398,"windowInnerWidth":398,"containerScrollWidth":720,"containerClientWidth":340,"hasHorizontalScroll":true}` — a página em si não tem scroll horizontal (398 == 398), só o container da tabela
- **Conclusão:** ✅ passou

---

## Evidências visuais

Inspeção de DOM/estilos computados confirma fundo, texto, linhas da tabela e comportamento responsivo corretos.

---

## Pontos importantes para code review

- A rotação alternada por linha (efeito do Figma) foi simplificada para um fade/slide único no card inteiro — decisão pré-aprovada no prompt da task, sem necessidade de sinalização adicional.

---

## Fora de escopo mantido

- Features, Métricas e demais seções — tasks 021+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Dashboard Showcase section (redesign)`
2. `docs(tasks): add walkthrough and mark task 020 as developed`

---

## Fechamento da entrega

### Branch

- `feat/020-landing-redesign-dashboard-showcase` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `e932050` — `feat(landing): add Dashboard Showcase section (redesign)`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/16
- **Título:** `feat(landing): seção Dashboard Showcase (nova, redesign)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/020-landing-redesign-dashboard-showcase`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
