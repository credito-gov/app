# Task 011 — Landing Page: Preço

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 010 merged
> **Estimativa:** 4-5h
> **Branch:** `feat/011-landing-pricing`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 010 está **merged**.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/011-landing-pricing
   ```
4. Esta é a task **6 da série Landing Page**.

---

## Contexto

Seção "6. Preço" do Figma (node `17:2`, file `47CFOJpk4Lm8LipC1pynyx`): um card de plano único em destaque + uma coluna lateral com garantia e bônus de entrada.

**⚠️ Atenção — modelo de monetização ainda não decidido:** `docs/PROJECT_CONTEXT.md` §12 lista "Modelo de monetização — SaaS direto, freemium, outra abordagem?" como **decisão em aberto**. O próprio Figma reflete isso: o valor da mensalidade e a taxa de sucesso aparecem como **placeholders literais entre colchetes** — `R$ [valor]` e `[x]%`. Esta task renderiza esses placeholders **exatamente como estão no design**, sem inventar um número. Não é erro de digitação do design — é intencional, aguardando a decisão de negócio.

---

## Objetivo

Implementar o componente `Pricing` com o card de plano único e a coluna lateral (garantia + bônus), fiel ao Figma.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Pricing.tsx` | Componente da seção de Preço |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<Pricing />` logo após `<Features />` |
| `docs/tasks/walkthrough/011-landing-pricing.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não substituir `R$ [valor]` ou `[x]%` por um número real — a decisão de preço não foi tomada (ver `PROJECT_CONTEXT.md` §12)
- ❌ Não implementar FAQ, CTA final ou Footer — tasks 012-013
- ❌ Não conectar o botão "Começar os 14 dias grátis" a nenhum fluxo real — apenas visual
- ❌ Não adicionar um segundo plano/tier — o design é de plano único
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma (node 17:2)

### Container da seção

- `bg-white`, `flex-col`, `items-center`, `gap-[32px]`, `px-[48px] py-[64px]`, `w-full`

### Cabeçalho (`flex-col gap-[8px] items-center`)

- Eyebrow: "PREÇO" — Inter Semi Bold, `12px`, cor `#9ca3af`, `tracking-[0.96px]`
- Título: "Um plano só. Você paga mais quando recupera mais." — Inter Semi Bold, `32px`, cor `#111827`, `text-center`, `tracking-[-0.8px]`
- Subtítulo: "Uma mensalidade fixa mais uma taxa de sucesso sobre o crédito que você efetivamente usa." — Inter Regular, `14px`, cor `#4b5563`, `text-center`, largura máx. `560px`

### Grid de preço (`flex gap-[24px] items-start`, largura total `940px` no desktop; empilhar em coluna no mobile)

#### Card do plano (`flex-[1_0_0]` até ~`536px`)

| Propriedade | Valor |
|---|---|
| Borda | `1.5px solid #10b981` |
| Sombra | `drop-shadow-[0px_4px_6px_rgba(16,185,129,0.12)]` (token "Shadow/Price Card Highlight") |
| Border radius | `10px` |

- Fita superior: `bg-[#ecfdf5]`, `px-[24px] py-[10px]`, `w-full` — texto "PLANO ÚNICO · CREDITOGOV PRO", Inter Semi Bold, `11px`, cor `#047857`, `tracking-[0.44px]`
- Corpo (`bg-white`, `flex-col gap-[16px]`, `p-[24px]`, `w-full`):
  1. Linha de preço: `flex gap-[6px] items-start`, cor base `#9ca3af`
     - "R$ [valor]" — Inter Semi Bold, `40px`, `tracking-[-1px]` (placeholder literal, não substituir)
     - "/mês" — Inter Regular, `16px`
  2. Divisor: linha horizontal fina, `140px` de largura — **implementar como `<hr>`/`<div>` de 1px**, não precisa de asset (é uma linha reta sem detalhe vetorial)
  3. Nota de taxa: "+ taxa de sucesso de [x]% sobre o crédito usado no mês" — Inter Regular, `13px`, cor `#9ca3af` (placeholder literal, não substituir)
  4. Lista de 4 benefícios (`flex-col gap-[8px] w-full`), cada item `flex gap-[10px] items-center`:
     - dot: `16x16px`, `bg-[#d1fae5]`, `rounded-full` (implementar como `<span>`, sem asset)
     - texto: Inter Regular, `13.5px`, cor `#111827`
     - Itens, nesta ordem: "Sincronização diária com a Receita Federal" · "Projeção de crédito para 90 dias" · "Compensação e antecipação ilimitadas" · "Suporte prioritário no fechamento do mês"
  5. Botão CTA: `bg-[#10b981]`, `py-[13px]`, `rounded-[6px]`, `w-full`, texto "Começar os 14 dias grátis" — Inter Semi Bold, `15px`, branco
  6. Rodapé: "Sem cartão. Cancele quando quiser, direto no painel." — Inter Regular, `12px`, cor `#6b7280`, `text-center`

#### Coluna lateral (`flex-col gap-[14px]`, largura ~`380px`)

- **Box Garantia**: `bg-[#f9fafb]`, `flex-col gap-[6px]`, `p-[20px]`, `rounded-[8px]`, `w-full`
  - "GARANTIA" — Inter Semi Bold, `11px`, cor `#9ca3af`
  - "30 dias para achar crédito, ou devolvemos" — Inter Semi Bold, `14px`, cor `#111827`
- **Box Bônus de Entrada**: `bg-white`, `border border-[#e5e7eb]`, `flex-col gap-[10px]`, `p-[20px]`, `rounded-[8px]`, `w-full`
  - "BÔNUS DE ENTRADA" — Inter Semi Bold, `11px`, cor `#9ca3af`
  - 3 itens (`flex gap-[8px] items-center w-full`): dot `14x14px` `bg-[#eff6ff]` `rounded-full` (sem asset) + texto `13px` Inter Regular cor `#111827`
    - "Diagnóstico retroativo de 60 meses"
    - "Onboarding assistido"
    - "Revisão fiscal no 1º mês"

---

## Passos sugeridos

1. Reabrir o node `17:2` no Figma Desktop (selecionar) e confirmar specs se houver dúvida
2. Criar `app/landing-page/src/components/Pricing.tsx`
3. Implementar o card do plano (fita, preço com placeholder, divisor, lista de benefícios, CTA, rodapé)
4. Implementar a coluna lateral (garantia + bônus)
5. Compor lado a lado no desktop, empilhado no mobile
6. Importar e renderizar `<Pricing />` em `App.tsx`, logo após `<Features />`
7. Testar visualmente em `npm run dev` — desktop e mobile, comparando com o screenshot do Figma
8. Criar o walkthrough em `docs/tasks/walkthrough/011-landing-pricing.md` — **somente depois do PR aberto**
9. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 011
10. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] Card do plano com fita superior, preço em `R$ [valor]` + `/mês`, nota de taxa `[x]%` — **placeholders intactos, sem número inventado**
- [ ] Lista de 4 benefícios com dot verde, textos exatos
- [ ] Botão CTA "Começar os 14 dias grátis" com estilo verde preenchido
- [ ] Coluna lateral com box de garantia e box de bônus (3 itens), textos exatos
- [ ] Em mobile (`< 768px`), card do plano e coluna lateral empilham em coluna única
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/011-landing-pricing.md` criado com evidências reais (screenshots comparando com o Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 011

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §12, decisão de monetização em aberto
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/010-landing-problem-features.md`](010-landing-problem-features.md) — task anterior da série
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `17:2` ("6. Preço")
