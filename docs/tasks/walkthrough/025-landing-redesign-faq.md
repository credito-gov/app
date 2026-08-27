# Walkthrough — Task 025 (Redesign: FAQ)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar/reescrever o componente `Faq` (extraído de `FaqAndFinalCta.tsx`) com o novo copy e estilo dark, sem o bloco de CTA final.

---

## O que foi entregue

### 1) `Faq.tsx`

- Título "Perguntas Frequentes", centralizado
- Grid de 4 perguntas em 2 colunas, cards `bg-[#0e1524]`, `border-[#1e293b]`
- 2 perguntas reescritas: "Como funciona a antecipação de caixa?" e "Qual a duração do período de teste gratuito?"
- Sem accordion — tudo sempre expandido, igual à versão anterior

### 2) `App.tsx`

- `<FaqAndFinalCta />` substituído por `<Faq />`

---

## Decisões técnicas fora do prompt

### Decisão 1: `FaqAndFinalCta.tsx` não foi removido nesta task

- **Contexto:** o prompt da task 025 dava discrição ao executor sobre como lidar com a transição, e o prompt da task 026 já assume explicitamente que a remoção do arquivo antigo acontece lá, não aqui.
- **Alternativa escolhida:** troquei o uso no `App.tsx` (de `<FaqAndFinalCta />` para `<Faq />`) mas deixei o arquivo `FaqAndFinalCta.tsx` no repositório, órfão, até a task 026 remover.
- **Sinalizado antes da execução:** ❌ Não necessário — já estava previsto nos prompts das duas tasks, sem ambiguidade.
- **Impacto:** o bloco de CTA final (título "Descubra quanto crédito...", botões) fica temporariamente fora da página renderizada entre esta task e a 026. Sem impacto real: a branch `feat/landing-redesign` inteira só vai ao ar (merge em `main`) depois que as 13 tasks estiverem completas — não é uma regressão em produção.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos (arquivo órfão `FaqAndFinalCta.tsx` não gera warning, já que TS/oxlint não sinalizam arquivos não importados, só imports não usados dentro de um arquivo)
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estrutura (desktop)

- **Comando:** `getComputedStyle`/`querySelectorAll`
- **Saída resumida:** `{"title":"Perguntas Frequentes","colCount":2,"questionsPerCol":[2,2],"allQuestions":["Meus dados fiscais e contábeis estão seguros?","Preciso mudar meu software ERP atual?","Como funciona a antecipação de caixa?","Qual a duração do período de teste gratuito?"]}`
- **Conclusão:** ✅ passou

---

## Evidências visuais

Inspeção de DOM/estilos computados confirma estrutura e conteúdo exatos.

---

## Pontos importantes para code review

- `FaqAndFinalCta.tsx` está órfão nesta PR — será removido na task 026, não é esquecimento.
- CTA final some temporariamente da página renderizada entre esta task e a 026 — comportamento esperado, documentado aqui e no prompt da task 026.

---

## Fora de escopo mantido

- CTA Final (seção própria) e Footer — tasks 026-027

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add standalone Faq section (redesign)`
2. `docs(tasks): add walkthrough and mark task 025 as developed`

---

## Fechamento da entrega

### Branch

- `feat/025-landing-redesign-faq` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `8999897` — `feat(landing): add standalone Faq section (redesign)`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/21
- **Título:** `feat(landing): seção FAQ própria (redesign)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/025-landing-redesign-faq`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
