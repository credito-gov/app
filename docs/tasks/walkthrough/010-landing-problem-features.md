# Walkthrough — Task 010 (Landing Page: Dor vs Solução + Features)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Implementar os componentes `ProblemSolution` (Dor vs Solução) e `Features`, fiéis ao Figma (nodes `15:103` e `16:2`), na ordem em que aparecem no design.

---

## O que foi entregue

### 1) Componente `ProblemSolution`

Arquivo: `app/landing-page/src/components/ProblemSolution.tsx`

- Cabeçalho: eyebrow "O DIA A DIA HOJE" + título "O crédito existe. Só não aparece pra ninguém."
- 3 cards com `.map()` sobre array local, cada um com bloco problema (vermelho, "PROBLEMA 0X") e bloco solução (branco, "COM O CREDITOGOV")

### 2) Componente `Features`

Arquivo: `app/landing-page/src/components/Features.tsx`

- Cabeçalho: eyebrow "O QUE VOCÊ GANHA" + título "Três coisas que resolvem o mês inteiro"
- 3 cards com `.map()`, cor do badge/ícone e do texto final parametrizada por item (2 verdes + 1 azul)

### 3) Ícones das Features

Arquivos: `app/landing-page/src/assets/icon-feature-sync.svg`, `icon-feature-projection.svg`, `icon-feature-actions.svg`

- Baixados das URLs temporárias do Figma MCP e commitados no repositório

### 4) Integração em `App.tsx`

- `<ProblemSolution />` e `<Features />` renderizados nessa ordem, logo após `<SocialProof />`

### 5) Fix: altura igual entre os cards

Após revisão visual, o responsável do projeto apontou que os cards de cada grid ficavam com alturas diferentes (proporcional ao próprio conteúdo). Corrigido em `ProblemSolution.tsx` e `Features.tsx`: o container do grid trocou `items-start` por `items-stretch`, e no `ProblemSolution` o bloco de solução (branco) virou `flex-1` para absorver a diferença de altura entre os blocos de problema.

---

## Decisões técnicas fora do prompt

Nenhuma decisão de conteúdo nova. Divergências de conteúdo (3 cards em vez de 6, cores mistas nas Features) já haviam sido identificadas e confirmadas na criação da task 010. O ajuste de altura dos cards (item 5 acima) foi um fix direto pedido em revisão, sem ambiguidade — não foi necessário perguntar antes de aplicar.

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
  ✓ 26 modules transformed.
  dist/assets/index-*.css   14.10 kB
  ✓ built in 255ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: Conteúdo e cores (desktop)

- **Comando:** `get_page_text` + inspeção via `getComputedStyle`
- **Saída resumida:**
  ```json
  { "problemTopBlocks": ["rgb(254, 242, 242)", "rgb(254, 242, 242)", "rgb(254, 242, 242)"],
    "bottomColors": ["rgb(255, 255, 255)", "rgb(255, 255, 255)", "rgb(255, 255, 255)"],
    "featureBadgeBg": ["rgb(236, 253, 245)", "rgb(236, 253, 245)", "rgb(239, 246, 255)"] }
  ```
- Confirma: 3 cards problema (vermelho `#fef2f2`) + solução (branco) na seção Dor vs Solução; 2 badges verdes (`#ecfdf5`) + 1 azul (`#eff6ff`) na Features
- Texto completo da página confere com a tabela de conteúdo da task (títulos, descrições, rótulos "PROBLEMA 01/02/03", tags "Você ganha: ...")
- **Conclusão:** ✅ passou

### Validação 4: Mobile (390x900)

- **Comando:** viewport redimensionado, inspeção via `getComputedStyle`
- **Saída resumida:** `{"problemFlex":"column","featuresFlex":"column"}` — ambos os grids empilham
- **Conclusão:** ✅ passou

> **Nota:** screenshot visual via browser pane apresentou erro intermitente neste ambiente; validação foi feita via extração de texto/DOM e `getComputedStyle`, que confirmam estrutura, conteúdo e cores corretos.

### Validação 5: alturas iguais (fix)

- **Comando:** `getBoundingClientRect().height` de cada card, em viewport 1280x1000
- **Saída resumida:** `{"problemHeights":[302.375,302.375,302.375],"featuresHeights":[255.390625,255.390625,255.390625]}` — todos os cards de cada grid com altura idêntica
- **Conclusão:** ✅ passou

---

## Evidências visuais

- Cores computadas dos blocos confirmam fidelidade ao Figma (vermelho/branco no Dor vs Solução, verde/azul nas Features).
- Texto completo extraído da página confirma ordem e conteúdo de todas as seções (Header → Hero → Prova Social → Dor vs Solução → Features).

---

## Pontos importantes para code review

- O texto "Você ganha: ..." nas Features é `<p>` estático, não `<a>` — conforme confirmado na criação da task.
- Cores dos cards de Features são passadas via `style` inline (não Tailwind puro) porque são dinâmicas por item do array — Tailwind não suporta classes com valores JS arbitrários vindos de variável sem safelist.

---

## Fora de escopo mantido

- Preço, FAQ, Footer — tasks 011-014

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Problem/Solution and Features sections`
2. `fix(landing): equalize card heights in Problem/Solution and Features grids`
3. `docs(tasks): add walkthrough and mark task 010 as developed`

---

## Fechamento da entrega

### Branch

- `feat/010-landing-problem-features`

### Commits realizados

1. `db97abb` — `feat(landing): add Problem/Solution and Features sections`
2. `0cba1f4` — `fix(landing): equalize card heights in Problem/Solution and Features grids`

> Conferido: `git log origin/main..HEAD` mostra apenas commits desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/5
- **Título:** `feat(landing): Dor vs Solução + Features`
- **Base:** `main`
- **Head:** `feat/010-landing-problem-features`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
