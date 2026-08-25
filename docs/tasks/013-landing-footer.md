# Task 013 — Landing Page: Footer

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 012 merged
> **Estimativa:** 2-3h
> **Branch:** `feat/013-landing-footer`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 012 está **merged**.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/013-landing-footer
   ```
4. Esta é a task **8 da série Landing Page** — última seção de conteúdo do design.

---

## Contexto

Seção "8. Footer" do Figma (node `18:47`, file `47CFOJpk4Lm8LipC1pynyx`): rodapé escuro com 4 colunas (marca, produto, empresa, legal) e uma barra inferior com copyright.

**Nota:** o link "Blog" aparece aqui, na coluna "EMPRESA" — confirma o que já havia sido observado na task 007: "Blog" nunca esteve na navbar, só no rodapé.

---

## Objetivo

Implementar o componente `Footer` com as 4 colunas e a barra de copyright, fiel ao Figma.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Footer.tsx` | Componente do Footer |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<Footer />` como último elemento da página |
| `docs/tasks/walkthrough/013-landing-footer.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não conectar os links a rotas reais — são `<a href="#">` ou texto estático até existirem páginas de destino
- ❌ Não adicionar ícones de redes sociais — não existem no design atual
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma (node 18:47)

### Container

- `bg-[#111827]` (`var(--neutral/text-primary)` usado como fundo aqui), `flex-col`, `items-start`, `gap-[32px]`, `px-[48px] pt-[44px] pb-[30px]`, `w-full`

### Linha de colunas (`flex gap-[32px] items-start w-full`, empilhar em coluna no mobile)

**Coluna 1 — Marca** (`flex-1 flex-col gap-[10px]`)
- Logo: `flex gap-[8px] items-center` — quadrado `24x24px` `bg-[#10b981]` `rounded-[6px]` + texto "CreditoGov" Inter Bold `16px` branco
- Descrição: "Apuração automática de crédito tributário de CBS/IBS para indústrias e distribuidoras." — Inter Regular, `13.5px`, `leading-[1.55]`, cor `#9ca3af`, largura `240px`

**Coluna 2 — PRODUTO** (`flex-1 flex-col gap-[10px]`)
- Header: "PRODUTO" — Inter Semi Bold, `12px`, branco, `tracking-[0.6px]`
- Links (Inter Regular, `13px`, cor `#9ca3af`): Como funciona · Preço · Segurança · Para contadores

**Coluna 3 — EMPRESA** (`flex-1 flex-col gap-[10px]`)
- Header: "EMPRESA" — mesmo estilo do header acima
- Links: Sobre · Blog · Central de ajuda · Contato

**Coluna 4 — LEGAL** (`flex-1 flex-col gap-[10px]`)
- Header: "LEGAL" — mesmo estilo do header acima
- Links: Termos de uso · Política de privacidade · LGPD · Status do sistema

### Barra inferior

- `border-t border-[rgba(255,255,255,0.1)]`, `flex items-center justify-between`, `pt-[20px]`, `w-full`
- Esquerda: "© 2026 CreditoGov. Todos os direitos reservados." — Inter Regular, `12px`, cor `#9ca3af`
- Direita: "Crédito tributário, todo santo dia." — Inter Regular, `12px`, cor `#9ca3af`
- Em mobile, empilhar as duas linhas (`flex-col items-start gap-[8px]`) em vez de `justify-between`

---

## Passos sugeridos

1. Reabrir o node `18:47` no Figma Desktop (selecionar) e confirmar specs se houver dúvida
2. Criar `app/landing-page/src/components/Footer.tsx`
3. Implementar as 4 colunas (usar `.map()` sobre um array local por coluna de links, evita repetição de JSX)
4. Implementar a barra de copyright
5. Importar e renderizar `<Footer />` em `App.tsx`, como último elemento da página
6. Testar visualmente em `npm run dev` — desktop (4 colunas) e mobile (colunas empilhadas), comparando com o screenshot do Figma
7. Criar o walkthrough em `docs/tasks/walkthrough/013-landing-footer.md` — **somente depois do PR aberto**
8. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 013
9. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] Fundo escuro (`#111827`), 4 colunas com os textos exatos do Figma
- [ ] "Blog" presente na coluna EMPRESA (confirmação da task 007: não pertence à navbar)
- [ ] Barra de copyright com as duas linhas de texto
- [ ] Em mobile (`< 768px`), colunas empilham em coluna única e a barra de copyright também empilha
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/013-landing-footer.md` criado com evidências reais (screenshots comparando com o Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 013

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/012-landing-faq-cta.md`](012-landing-faq-cta.md) — task anterior da série
- [`docs/tasks/007-landing-header.md`](007-landing-header.md) — origem da observação sobre "Blog"
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `18:47` ("8. Footer")
