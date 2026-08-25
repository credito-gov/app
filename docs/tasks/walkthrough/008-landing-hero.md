# Walkthrough — Task 008 (Landing Page: Hero Section)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Implementar o componente `Hero` da landing page: coluna esquerda (tag, H1, parágrafo, CTAs, microcopy) e coluna direita (card de dashboard simulado com sombra, saldo, dois mini-cards e gráfico de linha), fiel ao Figma (node `15:36`) e responsivo.

---

## O que foi entregue

### 1) Componente `Hero`

Arquivo: `app/landing-page/src/components/Hero.tsx`

- Coluna esquerda: pill "Integrado à Receita Federal", H1 (`46px`), parágrafo (largura máx. `480px`), dois CTAs (primário verde + secundário vazado), microcopy
- Coluna direita: card com barra de "janela" (3 dots), saldo `R$ 274.335,18`, mini-stats Validados/Pendentes, gráfico de linha (asset real), Action Band verde escuro com CTA "Compensar"
- `flex` lado a lado no desktop (`md:flex-row`), empilhado no mobile (`flex-col`)

### 2) Asset do gráfico

Arquivo: `app/landing-page/src/assets/hero-chart.svg`

- Baixado da URL temporária retornada pelo Figma MCP (`get_design_context`, node `15:63`) e commitado no repositório — não depende de hotlink externo que expira em ~7 dias

### 3) Integração em `App.tsx`

- `<Hero />` renderizado logo após `<Header />`

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu as specs do prompt da task 008 sem divergências.

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
  ✓ 19 modules transformed.
  dist/assets/index-*.css   12.24 kB
  ✓ built in 249ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: Desktop (1280x900)

- **Comando:** `npm run dev`, screenshot via browser
- **Resultado:** duas colunas lado a lado — tag, H1, parágrafo e CTAs à esquerda; card do mockup (saldo, mini-stats, gráfico, action band) à direita, com sombra visível
- **Conclusão:** ✅ passou

### Validação 4: Mobile (390x844)

- **Comando:** mesmo servidor, viewport redimensionado
- **Resultado:** colunas empilham — texto primeiro, início do card do mockup visível abaixo
- **Conclusão:** ✅ passou

---

## Evidências visuais

- **Desktop:** screenshot confirma layout de duas colunas, proporções e cores fiéis ao Figma.
- **Mobile:** screenshot confirma empilhamento vertical, ordem correta (texto → mockup).

---

## Pontos importantes para code review

- Valores do mockup (`R$ 274.335,18`, `R$ 152.430`, `R$ 121.905`, "Compensar R$ 50.000") são fixos, copiados do design — não são dados reais nem vêm de nenhuma API.
- Botões (CTA primário/secundário) apontam para anchors placeholder (`#testar-gratis`, `#agendar-demonstracao`), sem destino funcional ainda, conforme escopo da task.

---

## Fora de escopo mantido

- Prova Social, Dor vs Solução, Features, Preço, FAQ, Footer — tasks 009-014
- Qualquer integração com `app/backend` ou formulário real

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Hero section`
2. `docs(tasks): add walkthrough and mark task 008 as developed`

---

## Fechamento da entrega

### Branch

- `feat/008-landing-hero`

### Commits realizados

1. `618f495` — `feat(landing): add Hero section`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/3
- **Título:** `feat(landing): Hero Section`
- **Base:** `main`
- **Head:** `feat/008-landing-hero`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
