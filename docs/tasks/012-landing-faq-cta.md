# Task 012 — Landing Page: FAQ + CTA Final

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 011 merged
> **Estimativa:** 3-4h
> **Branch:** `feat/012-landing-faq-cta`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 011 está **merged**.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/012-landing-faq-cta
   ```
4. Esta é a task **7 da série Landing Page**.

---

## Contexto

Seção "7. FAQ + CTA Final" do Figma (node `18:2`, file `47CFOJpk4Lm8LipC1pynyx`): um grid de 4 perguntas frequentes em 2 colunas, seguido de um bloco de CTA final com dois botões.

**Nota de comportamento:** no Figma, as 4 perguntas aparecem **sempre expandidas** — não há accordion (clicar para abrir/fechar). Implementar como cards estáticos simples; não adicionar interação de expandir/recolher que não está no design.

---

## Objetivo

Implementar o componente `FaqAndFinalCta` com o grid de FAQ (2 colunas, 4 perguntas) e o bloco de CTA final, fiel ao Figma.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/FaqAndFinalCta.tsx` | Componente da seção de FAQ + CTA final |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<FaqAndFinalCta />` logo após `<Pricing />` |
| `docs/tasks/walkthrough/012-landing-faq-cta.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar o Footer — task 013
- ❌ Não transformar os cards de FAQ em accordion clicável — o design mostra tudo expandido
- ❌ Não adicionar mais perguntas além das 4 do Figma
- ❌ Não conectar os botões do CTA final a nenhum fluxo real — apenas visual
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma (node 18:2)

### Container da seção

- `bg-[#f9fafb]`, `flex-col`, `items-center`, `gap-[40px]`, `px-[48px] py-[64px]`, `w-full`

### Título

- "Perguntas frequentes" — Inter Semi Bold, `32px`, cor `#111827`, `text-center`, `tracking-[-0.8px]`

### Grid de FAQ

- Container: `flex gap-[16px] items-start`, largura total `940px` no desktop (2 colunas de `flex-1`); empilhar em coluna única no mobile
- Cada coluna: `flex-col gap-[16px]`
- Cada card de pergunta: `bg-white`, `border border-[#e5e7eb]`, `flex-col gap-[8px]`, `p-[22px]`, `rounded-[8px]`, `w-full`
  - Pergunta: Inter Semi Bold, `15px`, cor `#111827`
  - Resposta: Inter Regular, `13.5px`, `leading-[1.55]`, cor `#4b5563`

**Distribuição exata (coluna esquerda, depois coluna direita, na ordem do Figma):**

| Coluna | Pergunta | Resposta |
|---|---|---|
| Esquerda | Meus dados fiscais ficam seguros? | Sim. O acesso à Receita Federal é feito por procuração eletrônica registrada no e-CAC — não armazenamos suas credenciais, e todo o tráfego é criptografado. |
| Esquerda | Como funciona o cancelamento? Tem multa? | Você pode cancelar quando quiser direto no painel, sem multa e sem precisar falar com ninguém. O acesso continua até o fim do período já pago. |
| Direita | Preciso trocar de ERP ou de contador? | Não. O CreditoGov roda em paralelo ao que você já usa hoje. Não substituímos seu contador nem seu sistema de gestão — só automatizamos a apuração de crédito. |
| Direita | Vocês dão suporte no fechamento do mês? | Sim, suporte prioritário por chat e e-mail nos dias de fechamento, incluindo ajuda para entender qualquer crédito marcado como erro. |

### CTA final (`flex-col gap-[20px] items-center`)

- Título: "Descubra quanto crédito você tem parado hoje." — Inter Semi Bold, `20px`, cor `#111827`, `text-center`
- Botões (`flex gap-[14px] items-start`):
  - Primário: `bg-[#10b981]`, `px-[24px] py-[13px]`, `rounded-[6px]`, texto "Testar grátis por 14 dias" — Inter Semi Bold, `14px`, branco
  - Secundário (vazado): `bg-white`, `border border-[#d1d5db]`, `px-[24px] py-[13px]`, `rounded-[6px]`, texto "Falar com um especialista" — Inter Semi Bold, `14px`, cor `#374151`

---

## Passos sugeridos

1. Reabrir o node `18:2` no Figma Desktop (selecionar) e confirmar specs se houver dúvida
2. Criar `app/landing-page/src/components/FaqAndFinalCta.tsx`
3. Implementar o grid de FAQ (usar `.map()` sobre um array local de 4 perguntas, divididas em 2 colunas fixas conforme a tabela acima)
4. Implementar o bloco de CTA final
5. Importar e renderizar `<FaqAndFinalCta />` em `App.tsx`, logo após `<Pricing />`
6. Testar visualmente em `npm run dev` — desktop (2 colunas) e mobile (1 coluna), comparando com o screenshot do Figma
7. Criar o walkthrough em `docs/tasks/walkthrough/012-landing-faq-cta.md` — **somente depois do PR aberto**
8. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 012
9. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] Grid de FAQ com as 4 perguntas exatas, distribuídas em 2 colunas no desktop
- [ ] Cards de FAQ sempre expandidos (sem accordion/clique)
- [ ] CTA final com título e os 2 botões (primário verde + secundário vazado), textos exatos
- [ ] Em mobile (`< 768px`), FAQ empilha em coluna única
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/012-landing-faq-cta.md` criado com evidências reais (screenshots comparando com o Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 012

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/011-landing-pricing.md`](011-landing-pricing.md) — task anterior da série
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `18:2` ("7. FAQ + CTA Final")
