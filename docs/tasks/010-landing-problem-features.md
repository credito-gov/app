# Task 010 — Landing Page: Dor vs Solução + Features

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 009 merged
> **Estimativa:** 5-6h
> **Branch:** `feat/010-landing-problem-features`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 009 está **merged**.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/010-landing-problem-features
   ```
4. Esta é a task **5 da série Landing Page** (9 tasks ao todo: 006-014).

---

## Contexto

Esta task cobre **dois blocos consecutivos** do Figma: "4. Dor vs Solução" (node `15:103`) e "5. Features" (node `16:2`), file `47CFOJpk4Lm8LipC1pynyx`.

**Divergências confirmadas com o responsável do projeto** — ambas resolvidas a favor do Figma como fonte de verdade:

1. **Dor vs Solução** não é um grid de 6 cards com cabeçalhos pastéis rosa/amarelo/azul. São **3 cards**, cada um dividido em 2 metades empilhadas: topo vermelho claro ("PROBLEMA 0X") + base branca ("COM O CREDITOGOV", texto em verde). O título também é **"O crédito existe. Só não aparece pra ninguém."**, não "Você tem crédito. O problema é saber...".
2. **Features**: os ícones **não são todos azuis** — 2 dos 3 cards têm ícone com fundo verde, só o 3º é azul. O "link azul ao final" é na verdade um **texto colorido estático** ("Você ganha: ..."), não um link clicável — verde nos 2 primeiros cards, azul só no 3º.

---

## Objetivo

Implementar os componentes `ProblemSolution` (Dor vs Solução) e `Features`, fiéis ao Figma, na ordem em que aparecem no design.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/ProblemSolution.tsx` | Seção "Dor vs Solução" — 3 cards problema/solução |
| `app/landing-page/src/components/Features.tsx` | Seção "Features" — 3 cards de benefício |
| `app/landing-page/src/assets/icon-feature-sync.svg` | Ícone do card 1 (Features), baixado do Figma |
| `app/landing-page/src/assets/icon-feature-projection.svg` | Ícone do card 2 (Features), baixado do Figma |
| `app/landing-page/src/assets/icon-feature-actions.svg` | Ícone do card 3 (Features), baixado do Figma |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<ProblemSolution />` e `<Features />`, nessa ordem, logo após `<SocialProof />` |
| `docs/tasks/walkthrough/010-landing-problem-features.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar Preço, FAQ ou Footer — tasks 011-013
- ❌ Não transformar o texto "Você ganha: ..." em link/anchor real — é texto estático no design
- ❌ Não alterar as cores dos ícones/textos para padronizar tudo em uma cor só — reproduzir a mistura verde/azul exata do Figma
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma

### Seção "4. Dor vs Solução" (node 15:103)

**Container:** `bg-white`, `flex-col`, `items-center`, `gap-[32px]`, `px-[48px] py-[64px]`, `w-full`

**Cabeçalho** (`flex-col gap-[8px] items-center`):
- Eyebrow: "O DIA A DIA HOJE" — Inter Semi Bold, `12px`, cor `#9ca3af`, `tracking-[0.96px]`
- Título: "O crédito existe. Só não aparece pra ninguém." — Inter Semi Bold, `32px`, cor `#111827`, `text-center`, `leading-[1.2]`, `tracking-[-0.8px]`

**Grid de 3 cards** (`flex gap-[20px] items-start w-full`, empilhar em coluna no mobile):

Cada card: `border border-[#e5e7eb]`, `flex-1`, `flex-col`, `rounded-[8px]`, dividido em 2 blocos empilhados (sem gap entre eles, o card inteiro tem `overflow-clip`):

- **Bloco Problema** (topo): `bg-[#fef2f2]` (`var(--red/tint-bg)`), `border-b border-[#fee2e2]`, `p-[20px]`, `flex-col gap-[6px]`
  - "PROBLEMA 0X" — Inter Bold, `11px`, cor `#b91c1c`, `tracking-[0.44px]`
  - Subtítulo — Inter Semi Bold, `16px`, cor `#111827`
  - Descrição — Inter Regular, `13.5px`, `leading-[1.45]`, cor `#7f1d1d`
- **Bloco Solução** (base): `bg-white`, `p-[20px]`, `flex-col gap-[6px]`
  - "COM O CREDITOGOV" — Inter Bold, `11px`, cor `#047857`, `tracking-[0.44px]`
  - Subtítulo — Inter Semi Bold, `14px`, cor `#111827`
  - Descrição — Inter Regular, `13.5px`, `leading-[1.45]`, cor `#4b5563`

**Conteúdo exato dos 3 cards:**

| # | Problema (título) | Problema (texto) | Solução (título) | Solução (texto) |
|---|---|---|---|---|
| 1 | Planilha manual | Toda apuração depende de alguém consolidar notas fiscais e cruzar débitos à mão, todo mês. | O número se atualiza sozinho às 00:05 | Sincronizamos com a Receita Federal todo dia de madrugada — o saldo já está pronto quando você abre o painel. |
| 2 | Crédito prescreve sem ninguém ver | Créditos com prazo de uso passam despercebidos até vencer, e a empresa simplesmente perde o direito. | Cada crédito mostra os dias restantes | O painel avisa quando um crédito está perto de expirar, com o valor exposto para você agir a tempo. |
| 3 | Falta caixa com crédito parado no papel | A empresa tem crédito tributário de sobra, mas o caixa aperta porque esse valor não vira dinheiro rápido. | Compensar ou antecipar em dois cliques | Use o crédito para abater um débito de CBS/IBS ou antecipe com uma fintech parceira, direto no painel. |

Rótulos: "PROBLEMA 01" / "PROBLEMA 02" / "PROBLEMA 03".

---

### Seção "5. Features" (node 16:2)

**Container:** `bg-[#f9fafb]` (`var(--neutral/bg-app)`), `flex-col`, `items-center`, `gap-[32px]`, `px-[48px] py-[64px]`, `w-full`

**Cabeçalho** (`flex-col gap-[8px] items-center`):
- Eyebrow: "O QUE VOCÊ GANHA" — Inter Semi Bold, `12px`, cor `#9ca3af`, `tracking-[0.96px]`
- Título: "Três coisas que resolvem o mês inteiro" — Inter Semi Bold, `32px`, cor `#111827`, `text-center`, `tracking-[-0.8px]`

**Grid de 3 cards** (`flex gap-[20px] items-start w-full`, empilhar em coluna no mobile):

Cada card: `bg-white`, `border border-[#e5e7eb]`, `flex-1`, `flex-col gap-[12px]`, `p-[24px]`, `rounded-[8px]`, `shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]`

- Badge do ícone: `h-[38px]`, `rounded-[9px]`, `border`, ícone `20x20px` dentro — cor do badge varia por card (ver tabela)
- Título do card — Inter Semi Bold, `17px`, cor `#111827`
- Descrição — Inter Regular, `14px`, `leading-[1.45]`, cor `#4b5563`
- Texto final ("Você ganha: ...") — Inter Semi Bold, `13px`, cor varia por card (ver tabela) — **texto estático, não é link**

**Conteúdo e cores exatas dos 3 cards:**

| # | Cor do badge/ícone | Título | Descrição | Texto final | Cor do texto final |
|---|---|---|---|---|---|
| 1 | Verde (`bg-[#ecfdf5]`, `border-[#a7f3d0]`) | Sincronização automática com o governo | Todo dia às 00:05, buscamos suas notas fiscais e cruzamos débitos direto com a Receita Federal via certificado digital. | Você ganha: zero planilha manual | Verde `#047857` |
| 2 | Verde (`bg-[#ecfdf5]`, `border-[#a7f3d0]`) | Projeção de 90 dias | Veja não só o que já está validado, mas o que ainda vai entrar de crédito nos próximos três meses. | Você ganha: previsibilidade de caixa | Verde `#047857` |
| 3 | Azul (`bg-[#eff6ff]`, `border-[#bfdbfe]`) | Compensar e antecipar em dois cliques | Abata um débito de CBS/IBS com o crédito disponível, ou antecipe com uma fintech parceira, sem sair do painel. | Você ganha: crédito virando caixa rápido | Azul `#1d4ed8` |

### Assets

Os 3 ícones de 20x20px (nodes `16:9`, `16:17`, `16:26` no Figma) são SVGs com desenho vetorial real — **baixar e commitar**, não hotlinkar:
- `app/landing-page/src/assets/icon-feature-sync.svg` (card 1)
- `app/landing-page/src/assets/icon-feature-projection.svg` (card 2)
- `app/landing-page/src/assets/icon-feature-actions.svg` (card 3)

---

## Passos sugeridos

1. Reabrir os nodes `15:103` e `16:2` no Figma Desktop (selecionar) e confirmar specs se houver dúvida
2. Baixar os 3 ícones de Features e salvar em `app/landing-page/src/assets/`
3. Criar `app/landing-page/src/components/ProblemSolution.tsx` — usar `.map()` sobre um array local dos 3 pares problema/solução
4. Criar `app/landing-page/src/components/Features.tsx` — usar `.map()` sobre um array local dos 3 cards, com cor parametrizada por item
5. Importar e renderizar `<ProblemSolution />` e `<Features />` em `App.tsx`, nessa ordem, após `<SocialProof />`
6. Testar visualmente em `npm run dev` — desktop e mobile, comparando com o screenshot do Figma
7. Criar o walkthrough em `docs/tasks/walkthrough/010-landing-problem-features.md` — **somente depois do PR aberto**
8. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 010
9. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] "Dor vs Solução": 3 cards com bloco vermelho (problema) + bloco branco (solução verde), textos exatos da tabela
- [ ] "Features": 3 cards com ícone/texto final coloridos conforme a tabela (2 verdes + 1 azul), textos exatos
- [ ] Nenhum "link" clicável criado para o texto "Você ganha: ..." — é texto estático
- [ ] Ícones dos cards de Features usando os assets commitados (não hotlink)
- [ ] Em mobile (`< 768px`), ambos os grids empilham em coluna única
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/010-landing-problem-features.md` criado com evidências reais (screenshots comparando com o Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 010

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/009-landing-social-proof.md`](009-landing-social-proof.md) — task anterior da série
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, nodes `15:103` ("4. Dor vs Solução") e `16:2` ("5. Features")
