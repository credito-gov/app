# Walkthrough — Task 011 (Landing Page: Preço)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Implementar o componente `Pricing` com o card de plano único e a coluna lateral (garantia + bônus), fiel ao Figma (node `17:2`).

---

## O que foi entregue

### 1) Componente `Pricing`

Arquivo: `app/landing-page/src/components/Pricing.tsx`

- Card do plano: fita "PLANO ÚNICO · CREDITOGOV PRO", preço `R$ [valor]/mês`, divisor, nota de taxa `[x]%`, lista de 4 benefícios, CTA "Começar os 14 dias grátis", rodapé
- Coluna lateral: box de garantia + box de bônus (3 itens)
- Larguras fixas no desktop replicando o Figma: card `536px`, coluna lateral `380px`, `gap-6` (24px)

### 2) Integração em `App.tsx`

- `<Pricing />` renderizado logo após `<Features />`

---

## Decisões técnicas fora do prompt

Nenhuma. Placeholders de preço (`R$ [valor]`, `[x]%`) mantidos exatamente como especificado no prompt da task — decisão de negócio já documentada em `PROJECT_CONTEXT.md` §12, não uma decisão nova desta execução.

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
  ✓ 27 modules transformed.
  dist/assets/index-*.css   15.05 kB
  ✓ built in 273ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: Conteúdo e placeholders (desktop, 1280x1000)

- **Comando:** `get_page_text`
- **Saída resumida:** texto extraído confirma `R$ [valor]`, `/mês`, `+ taxa de sucesso de [x]% sobre o crédito usado no mês`, os 4 benefícios, "GARANTIA" e os 3 itens de bônus — todos intactos, sem número inventado
- **Conclusão:** ✅ passou

### Validação 4: Larguras (desktop, 1280x1000)

- **Comando:** inspeção via `getBoundingClientRect()` e `getComputedStyle()`
- **Saída resumida:** `{"planCardWidth":536,"sideColWidth":380,"planCardBorderColor":"rgb(16, 185, 129)"}` — larguras e cor da borda batem exatamente com o Figma
- **Conclusão:** ✅ passou

### Validação 5: Mobile (390x900)

- **Comando:** viewport redimensionado, inspeção via `getComputedStyle`
- **Saída resumida:** `{"gridDirection":"column","planCardWidth":342}` — empilha em coluna, card ocupa a largura disponível da tela
- **Conclusão:** ✅ passou

> **Nota:** screenshot visual via browser pane apresentou instabilidade neste ambiente; validação foi feita via extração de texto/DOM e `getComputedStyle`, que confirmam estrutura, conteúdo e dimensões corretos.

---

## Evidências visuais

- Texto completo extraído da página confirma ordem e conteúdo de todas as seções (Header → ... → Preço).
- Medições de largura confirmam fidelidade dimensional ao Figma (536px/380px no desktop).

---

## Pontos importantes para code review

- `R$ [valor]` e `[x]%` são strings literais no JSX — não são inputs nem variáveis de config. Substituir apenas quando a decisão de preço for tomada (fora do escopo desta task).
- Nenhum plano adicional/tier foi criado — o design é de plano único.

---

## Fora de escopo mantido

- FAQ, CTA final, Footer — tasks 012-014
- Qualquer lógica de checkout/pagamento

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Pricing section`
2. `docs(tasks): add walkthrough and mark task 011 as developed`

---

## Fechamento da entrega

### Branch

- `feat/011-landing-pricing`

### Commits realizados

1. `4432112` — `feat(landing): add Pricing section`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/6
- **Título:** `feat(landing): Preço`
- **Base:** `main`
- **Head:** `feat/011-landing-pricing`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
