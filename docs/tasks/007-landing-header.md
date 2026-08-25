# Task 007 — Landing Page: Header (Navbar)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 006 merged
> **Estimativa:** 2-3h
> **Branch:** `feat/007-landing-header`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — a sequência obrigatória por task (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 006 está **merged** (scaffold de `app/landing-page/` precisa existir).
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/007-landing-header
   ```
4. Esta é a task **2 da série Landing Page** (9 tasks ao todo: 006-014).

---

## Contexto

Com o scaffold da landing page pronto (task 006), esta task implementa o primeiro bloco visual real: o Header/Navbar fixo no topo da página. O design vem do Figma (`CréditoGov — Design`, node `15:6`, dentro do frame "Landing Page (3a)").

**Fonte do design:** especificações abaixo foram extraídas via Figma MCP (`get_design_context`) diretamente do node do Header. Em caso de dúvida sobre cor, espaçamento ou tipografia não coberta aqui, reabra o node no Figma Desktop e inspecione — não estime visualmente.

**Divergência encontrada:** o pedido original mencionava links "Como funciona, Preço, FAQ, Blog, Entrar", mas o Figma **não tem "Blog" na navbar** (Blog só existe no rodapé) e o item chama-se **"Perguntas"**, não "FAQ". Esta task segue o Figma como fonte de verdade. Se "Blog" no header for intencional, pare e pergunte antes de divergir do design.

---

## Objetivo

Implementar o componente `Header` (navbar) da landing page, fiel ao design do Figma, responsivo (colapsa para menu hambúrguer em telas menores).

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Header.tsx` | Componente do Header/Navbar |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<Header />` no topo |
| `docs/tasks/walkthrough/007-landing-header.md` | **Obrigatório.** Walkthrough — criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar Hero, Prova Social, Features, Preço, FAQ ou Footer — cada seção é uma task própria (008-013)
- ❌ Não criar rotas ou navegação real (scroll-to-anchor pode ser um `href="#id"` simples; sem lib de routing)
- ❌ Não adicionar "Blog" ou renomear "Perguntas" para "FAQ" sem confirmar — ver "Divergência encontrada" acima
- ❌ Não implementar o formulário/lógica do botão "Testar grátis" — só o botão visual, sem destino definido ainda
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma (node 15:6)

### Container da navbar

| Propriedade | Valor |
|---|---|
| Altura | `64px` |
| Background | `var(--neutral/surface, #ffffff)` |
| Borda inferior | `1px solid var(--neutral/border-card, #e5e7eb)` |
| Padding horizontal | `48px` (`px-12` em Tailwind com escala padrão, ou `px-[48px]`) |
| Layout | `flex`, `items-center`, `justify-between`, `w-full` |

### Logo (esquerda)

- Container: `flex`, `items-center`, `gap-[8px]`
- Ícone: quadrado `24x24px`, `bg-[#10b981]` (`var(--green/base)`), `rounded-[6px]` (`var(--radius/6)`)
- Texto "CreditoGov": Inter **Bold**, `16px`, cor `var(--neutral/text-primary, #111827)`, `tracking-[-0.16px]`

> Nota: o design usa um retângulo verde como placeholder de logo (sem SVG de marca definido). Reproduzir como está — não inventar um ícone.

### Links de navegação (centro/direita, antes do CTA)

- Container: `flex`, `items-center`, `gap-[28px]`
- Estilo padrão dos links: Inter **Regular**, `13.5px`, cor `var(--neutral/body-text, #4b5563)`
- Itens, nesta ordem exata:
  1. "Como funciona"
  2. "Preço"
  3. "Perguntas"
  4. "Entrar" — **exceção de estilo**: Inter **Medium**, `13.5px`, cor `var(--neutral/text-primary, #111827)` (mais escuro que os demais, sem ser botão)

### Botão CTA "Testar grátis"

| Propriedade | Valor |
|---|---|
| Background | `var(--green/base, #10b981)` |
| Padding | `px-[16px] py-[9px]` |
| Border radius | `var(--radius/6, 6px)` |
| Texto | Inter **Semi Bold**, `13.5px`, cor branca |

### Responsividade (requisito da task, não estava explícito no node do Figma para mobile)

- Abaixo do breakpoint `md` (768px): ocultar o `<nav>` de links centrais e o botão vira parte do menu hambúrguer, ou mantém-se visível conforme decisão de UX — **manter simples**: ícone de hambúrguer que abre/fecha um painel com os mesmos links empilhados verticalmente
- Logo sempre visível
- Container centralizado: `max-w-7xl mx-auto` por dentro do `<header>` full-width, mantendo os `48px` de padding lateral em telas grandes e reduzindo para algo como `16px`-`24px` em mobile

---

## Passos sugeridos

1. Criar `app/landing-page/src/components/Header.tsx`
2. Implementar a estrutura desktop primeiro, validando contra o screenshot do Figma (cores, espaçamento, tipografia)
3. Adicionar o estado de menu mobile (hambúrguer) com um simples `useState` — sem lib de animação
4. Importar e renderizar `<Header />` em `App.tsx`
5. Testar visualmente em `npm run dev`: desktop (>768px) e mobile (<768px), redimensionando a janela
6. Comparar lado a lado com o screenshot retornado pelo Figma MCP
7. Criar o walkthrough em `docs/tasks/walkthrough/007-landing-header.md` — **somente depois do PR aberto**
8. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 007
9. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] Header renderiza com logo à esquerda, links + CTA à direita, alinhado ao design do Figma (cores, fonte, espaçamento conferem)
- [ ] Em telas `< 768px`, links somem/viram hambúrguer; hambúrguer abre e fecha o menu
- [ ] Container interno respeita `max-w-7xl` centralizado com padding lateral
- [ ] Nenhum link "Blog" adicionado sem confirmação prévia
- [ ] `npm run build` (dentro de `app/landing-page/`) sem erros
- [ ] Lint/format passam sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/007-landing-header.md` criado com evidências reais (screenshots do resultado vs. Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 007

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/006-landing-page-architecture.md`](006-landing-page-architecture.md) — scaffold pré-requisito
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `15:6` ("1. Nav")
