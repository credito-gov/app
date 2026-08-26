# Walkthrough — Task 017 (Redesign: Hero)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Reescrever `Hero.tsx` fiel ao redesign: coluna esquerda (eyebrow, H1, parágrafo, CTAs, microcopy) e coluna direita (mockup "Painel Executivo"), com animações de entrada via `useScrollReveal`.

---

## O que foi entregue

### 1) `Hero.tsx` reescrito

- Copy exato do redesign (H1, parágrafo, microcopy)
- CTA primário com contraste invertido (texto `#060a13` sobre fundo verde)
- Mockup "Painel Executivo": label na barra de janela, cards Validado/Pendente com tint dark (`rgba(5,150,105,0.08)` / `rgba(217,119,6,0.08)`), Action Pill com subtítulo "Vencimento próximo em 20/01" e botão invertido (branco/texto verde)
- Gráfico reaproveitado de `hero-chart.svg` (task 008/009)
- Animação: `.reveal-left` na coluna de texto, `.reveal-right` no mockup, via `useScrollReveal`

---

## Decisões técnicas fora do prompt

### Decisão 1: gradiente radial via CSS puro, não via SVG embutido

- **Contexto:** o Figma especifica o fundo da Hero como uma imagem SVG embutida (`data:image/svg+xml`) com um `radialGradient` complexo.
- **Alternativa escolhida:** `background: radial-gradient(ellipse 900px 500px at 85% 10%, rgba(4,120,87,0.15), transparent 60%), #060a13` — CSS puro, sem necessidade de gerar/embutir um SVG. Visualmente equivalente (glow verde sutil no canto superior direito).
- **Sinalizado antes da execução:** ❌ Não — já estava previsto no prompt da task como abordagem aceita implicitamente ("gradiente radial sutil verde... pode reaproveitar a mesma técnica"); é uma simplificação de implementação, não de resultado visual.
- **Impacto:** nenhum negativo — confirmado visualmente via screenshot (ver evidências).

### Decisão 2: convenção de nomeação ao destruturar `useScrollReveal`

- **Contexto:** `oxlint` acusou falso positivo (`react(refs): Cannot access refs during render`) ao acessar `left.ref`/`mockup.ref` (propriedade `.ref` de um objeto retornado pelo hook, não um ref em si sendo lido durante o render).
- **Alternativa escolhida:** destruturar imediatamente com nomes (`const { ref: leftRef, isVisible: leftVisible } = useScrollReveal(...)`), eliminando o acesso via `.ref`/`.isVisible` como member expression. Aviso desapareceu, comportamento idêntico.
- **Sinalizado antes da execução:** ❌ Não — ajuste de estilo de código sem impacto funcional.
- **Impacto:** nenhum. **Recomendo essa convenção para as próximas tasks (018+)** que usarem `useScrollReveal`, para evitar o mesmo aviso.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** lint sem avisos (após a Decisão 2); build sem erros
- **Conclusão:** ✅ passou

### Validação 2: renderização visual (desktop, 1280x1000)

- **Comando:** screenshot via browser em `npm run dev`
- **Resultado:** Hero dark com nav, eyebrow, H1, parágrafo, dois CTAs, mockup "PAINEL EXECUTIVO" com saldo, cards Validado/Pendente, gráfico e Action Pill — visualmente fiel ao Figma
- **Conclusão:** ✅ passou (ver evidências visuais)

---

## Evidências visuais

Screenshot do resultado renderizado (1280x1000, desktop) confirma fidelidade ao design: cores, copy, estrutura de duas colunas e o mockup completo.

---

## Pontos importantes para code review

- O gradiente de fundo é uma aproximação via CSS (Decisão 1) — visualmente equivalente, mas não pixel-idêntico ao SVG do Figma.
- Convenção de destructuring do `useScrollReveal` (Decisão 2) recomendada para as próximas tasks.

---

## Fora de escopo mantido

- Prova Social, Como Funciona, Dashboard Showcase e demais seções — tasks 018+

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): redesign Hero to dark, new copy, richer mockup`
2. `docs(tasks): add walkthrough and mark task 017 as developed`

---

## Fechamento da entrega

### Branch

- `feat/017-landing-redesign-hero` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `684a243` — `feat(landing): redesign Hero to dark, new copy, richer mockup`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/13
- **Título:** `feat(landing): redesign Hero (dark, copy novo, mockup Painel Executivo)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/017-landing-redesign-hero`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
