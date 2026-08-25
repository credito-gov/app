# Walkthrough — Task 007 (Landing Page: Header/Navbar)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Implementar o componente `Header` (navbar) da landing page, fiel ao design do Figma (node `15:6`), responsivo (colapsa para menu hambúrguer em telas menores).

---

## O que foi entregue

### 1) Componente `Header`

Arquivo: `app/landing-page/src/components/Header.tsx`

- Logo (retângulo verde `24x24px` + texto "CreditoGov")
- Links de navegação: "Como funciona", "Preço", "Perguntas", "Entrar" (estilo diferenciado) + botão "Testar grátis"
- Container interno `max-w-7xl mx-auto` com padding lateral `48px` no desktop, `24px` no mobile
- Menu hambúrguer (`useState`) abaixo de `768px`, com painel dropdown contendo os mesmos links empilhados

### 2) Integração em `App.tsx`

Arquivo: `app/landing-page/src/App.tsx`

- `<Header />` renderizado no topo da página

### 3) Fonte Inter

Arquivos: `app/landing-page/index.html`, `app/landing-page/src/index.css`

- Adicionado `<link>` para Google Fonts (Inter, pesos 400/500/600/700)
- `body { font-family: "Inter", sans-serif; }` em `index.css`

---

## Decisões técnicas fora do prompt

### Decisão 1: adicionar a fonte Inter nesta task

- **Contexto:** o design inteiro (todas as 8 seções) usa Inter em variações de peso (Regular/Medium/Semi Bold/Bold). O scaffold da task 006 não incluía nenhuma fonte customizada.
- **Alternativa escolhida:** carregar Inter via Google Fonts no `index.html` e aplicar como `font-family` padrão do `body`, já nesta primeira task de conteúdo — evita que cada task subsequente precise lembrar de configurar isso.
- **Sinalizado antes da execução:** ❌ Não (é uma decisão de suporte necessária para qualquer seção ficar fiel ao Figma, não uma mudança de escopo visual da task 007 em si) — documentada aqui.
- **Impacto:** nenhum, apenas viabiliza a fidelidade tipográfica exigida por todas as tasks seguintes (008-014).

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
  ✓ 17 modules transformed.
  dist/assets/index-*.css    8.50 kB
  ✓ built in 246ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: Desktop (≥768px)

- **Comando:** `npm run dev`, inspeção via browser em 1280x800
- **Verificado via `getComputedStyle`:**
  ```json
  { "navDisplay": "flex", "btnDisplay": "none", "headerHeight": "64px",
    "navLinks": ["Como funciona", "Preço", "Perguntas", "Entrar", "Testar grátis"] }
  ```
- **Conclusão:** ✅ passou — nav visível, hambúrguer oculto, ordem dos itens correta, altura do header 64px

### Validação 4: Mobile (<768px, viewport 375x700)

- **Comando:** clique programático no botão do menu (`button[aria-label].click()`), inspeção do HTML resultante
- **Saída resumida:** `aria-expanded` mudou para `"true"`, label mudou para "Fechar menu", painel dropdown renderizado com os 5 itens (Como funciona, Preço, Perguntas, Entrar, Testar grátis) empilhados
- **Conclusão:** ✅ passou

---

## Evidências visuais

- **Desktop (1280x800):** screenshot confirma logo à esquerda, nav + CTA à direita, alinhados.
- **Mobile (375x700):** screenshot confirma logo + hambúrguer; clique no hambúrguer expande painel com links empilhados (confirmado via inspeção de DOM, não só visual).

---

## Pontos importantes para code review

- Nenhum link real de destino (`href="#..."`) — são anchors placeholder, conforme escopo da task (sem rotas reais ainda).
- "Blog" não foi incluído na navbar e "FAQ" foi mantido como "Perguntas" — decisão já alinhada na criação da task 007, reconfirmada aqui.
- Fonte Inter adicionada nesta task impacta visualmente todo o app (inclusive o placeholder anterior), é esperado.

---

## Fora de escopo mantido

- Hero, Prova Social, Features, Preço, FAQ, Footer — tasks 008-014
- Rotas reais ou scroll-to-anchor funcional
- Lógica/destino do botão "Testar grátis"

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Header/Navbar component`
2. `docs(tasks): add walkthrough and mark task 007 as developed`

---

## Fechamento da entrega

### Branch

- `feat/007-landing-header`

### Commits realizados

1. `bbcd754` — `feat(landing): add Header/Navbar component`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/2
- **Título:** `feat(landing): Header (Navbar)`
- **Base:** `main`
- **Head:** `feat/007-landing-header`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
