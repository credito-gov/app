# Task 016 — Landing Page Redesign: Header/Nav

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 015 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/016-landing-redesign-header` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` — sequência obrigatória é inegociável.
2. Confira em `docs/tasks/README.md` que a task 015 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — **nunca para `main`** (ver task 015 para o contexto completo dessa decisão).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/016-landing-redesign-header
   ```
4. Task **2 de 13** da série de redesign. Reaproveite `useScrollReveal` e os tokens da task 015.

---

## Contexto

Redesenha o `Header.tsx` existente para o visual dark do redesign (Figma node `58:27`, "navigation"): nav fixa no topo com blur, novo item de menu, e remoção do CTA do próprio nav.

**Divergências vs. o Header atual (tasks 007/014):**
- Nav vira **fixa** (`position: fixed` ou `sticky`) com fundo translúcido + blur — antes era estática no topo do fluxo
- Item novo: **"Soluções"** entre "Como funciona" e "Preço"
- **"Perguntas" volta a ser "FAQ"**
- O **botão "Testar grátis" some do nav** — sobra só o link "Entrar" à direita
- Logo cresce de 24px para 28px

---

## Objetivo

Reescrever `Header.tsx` com o visual e estrutura do redesign: nav fixa translúcida com blur, logo real (mesmo lockup da task 014, reaproveitar), novos links, sem CTA.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Header.tsx` | Reescrito: nav fixa, blur, novos links, sem botão CTA |
| `docs/tasks/walkthrough/016-landing-redesign-header.md` | **Obrigatório.** Criado **depois** do PR aberto. |

---

## Fora de escopo (NÃO faça)

- ❌ Não mexer em nenhuma outra seção (Hero, Footer, etc.) — tasks 017-027
- ❌ Não criar menu mobile novo do zero — reaproveitar a lógica de hambúrguer já existente, só re-estilizada para o tema dark
- ❌ Não adicionar de volta o botão CTA no nav — o design não tem

---

## Detalhes técnicos — specs do Figma (node 58:27)

### Container

- `position: fixed` (topo, `top-0 left-0 right-0`), `z-index` alto para ficar acima do conteúdo
- `height: 80px` (era 64px)
- `background: rgba(6,10,19,0.8)` + `backdrop-filter: blur(10px)`
- `border-bottom: 1px solid #1e293b`
- Padding horizontal `64px` (era 48px) — desktop; manter responsivo em mobile
- **Importante:** como a nav agora é fixa, o conteúdo abaixo precisa de um spacer de `80px` de altura no topo da página (`navbar-spacer` no Figma) para não ficar coberto — adicionar como primeiro elemento depois do header, ou padding-top equivalente no primeiro elemento da Hero.

### Logo

- Quadrado verde `28px` (era 24px) + texto "CreditoGov" Inter **Extra Bold**, `18px`, branco, `tracking-[-0.36px]`
- Reaproveitar o lockup real da marca (`logo-lockup.png`, da task 014) redimensionado, ou o ícone standalone — como o fundo agora é escuro, usar a variante **branca** do lockup (`logo-lockup-white.png`, já existe da task 014) já que o fundo da nav é escuro

### Links de navegação

- Container: `gap-[24px]`
- Itens, nesta ordem: **Como funciona**, **Soluções**, **Preço**, **FAQ** — todos Inter Medium, `14px`, cor `#94a3b8`, com `padding: 8px`
- Divisor vertical: `1px` altura `16px`, cor `#1e293b`
- **Entrar**: mesmo estilo dos links (não há mais destaque diferenciado nem botão)
- **Sem CTA "Testar grátis" no nav**

### Mobile

- Manter o comportamento de hambúrguer já implementado, re-estilizado para as cores do redesign (ícone branco, painel dropdown com fundo `#0e1524`, links com as cores acima)

---

## Passos sugeridos

1. Reabrir o node `58:27` no Figma Desktop e confirmar specs se houver dúvida
2. Reescrever `Header.tsx`: `position: fixed`, blur, novo padding/altura
3. Adicionar o spacer de 80px logo após o `<Header />` em `App.tsx` (ou como parte do próprio componente)
4. Atualizar os links (adicionar "Soluções", renomear "Perguntas" → "FAQ", remover o CTA)
5. Trocar o logo para a variante branca (fundo agora é escuro)
6. Aplicar `useScrollReveal` na nav conforme o efeito descrito (fade + slide de cima, -20px → 0)
7. Testar visualmente em `npm run dev` — desktop e mobile, com scroll (nav deve ficar fixa e não sumir)
8. Criar o walkthrough — **somente depois do PR aberto**
9. Atualizar `docs/tasks/README.md`
10. Sincronizar com `origin/feat/landing-redesign` e abrir PR **contra `feat/landing-redesign`**

---

## Critérios de validação

- [ ] Nav fixa no topo, com blur visível sobre o conteúdo ao rolar
- [ ] Links: Como funciona, Soluções, Preço, FAQ, divisor, Entrar — sem CTA
- [ ] Logo branco (lockup) visível corretamente sobre o fundo translúcido
- [ ] Conteúdo da página não fica coberto pela nav fixa (spacer funcionando)
- [ ] Menu mobile mantém a funcionalidade, com estilo atualizado
- [ ] `npm run build` sem erros
- [ ] **PR aberto antes do walkthrough**
- [ ] Kanban atualizado

---

## Referências

- [`docs/tasks/015-landing-redesign-motion-foundation.md`](015-landing-redesign-motion-foundation.md)
- Figma: node `58:27` ("navigation") + `58:42` ("navbar-spacer")
