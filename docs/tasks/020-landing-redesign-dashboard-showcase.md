# Task 020 — Landing Page Redesign: Dashboard Showcase (nova seção)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 019 merged **em `feat/landing-redesign`**
> **Estimativa:** 4-5h
> **Branch:** `feat/020-landing-redesign-dashboard-showcase` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 019 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/020-landing-redesign-dashboard-showcase
   ```
4. Task **6 de 13**.

---

## Contexto

**Seção nova**: um mockup grande de tabela ("Transações de Crédito Recentes") — Figma node `58:121`, "dashboard-showcase". É uma vitrine mais robusta do produto do que o card pequeno da Hero.

---

## Objetivo

Criar o componente `DashboardShowcase` com cabeçalho + card de tabela (header + linhas de transação fictícias).

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/DashboardShowcase.tsx` | Novo componente |
| `app/landing-page/src/App.tsx` | Atualizado, posição após `HowItWorks` |
| `docs/tasks/walkthrough/020-landing-redesign-dashboard-showcase.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não conectar a nenhuma API real — os dados da tabela são fixos/fictícios, iguais aos do Figma
- ❌ Não implementar paginação, filtros ou interação de tabela real — é só uma vitrine estática

---

## Detalhes técnicos — specs do Figma (node 58:121)

### Container

- `bg-[#060a13]` (herda o fundo base — sem cor própria), `px-[64px] py-[96px]`, `gap-[56px]`

### Cabeçalho

- Eyebrow: "Painel de Controle" — mesmo estilo do eyebrow dark da Hero (`rgba(4,120,87,0.15)` bg, borda `rgba(4,120,87,0.5)`)
- Título: "Seus créditos estruturados e sob controle" — Inter Extra Bold, `36px`, branco, centralizado
- Subtítulo: "Esqueça arquivos soltos no drive. Centralize toda a gestão fiscal de sua operação em um dashboard auditável." — Inter Regular, `16px`, cor `#94a3b8`, centralizado, largura `540px`

### Card da tabela

- `bg-[#0e1524]`, `border-[#1e293b]`, `rounded-[16px]`, `overflow-hidden`, `w-full`

**Header do card**: `bg-[#0c121e]`, border-bottom `#1e293b`, `p-[20px]`, `justify-between` — título "Transações de Crédito Recentes" (Bold `14px` branco)

**Linha de cabeçalho da tabela**: `bg-[#0c121e]`, border-bottom `#1e293b`, `px-[24px] py-[12px]`, colunas (Inter Bold `11px`, cor `#64748b`): PERÍODO DE APURAÇÃO (flex-1) · ORIGEM (`120px`) · TRIBUTO (`150px`) · VALOR BRUTO (`150px`) · STATUS (`120px`)

**Linhas de dados** (border-bottom `#1e293b` entre elas, `px-[24px] py-[16px]`):

| Período | Origem | Tributo | Valor Bruto | Status |
|---|---|---|---|---|
| Novembro/2025 | Nota de Entrada | CBS Retida | R$ 48.910,22 | — |
| Outubro/2025 | Faturamento | IBS Devido | R$ 104.312,18 | — |
| Setembro/2025 | Combustível | Crédito Presumido | R$ 12.435,00 | **Pendente** (badge âmbar) |
| Agosto/2025 | Exportação | Diferimento CBS | R$ 108.677,78 | — |

- Período: Semi Bold `13px` branco. Origem/Tributo: Regular `13px` cor `#94a3b8`. Valor: Bold `13px` branco.
- Badge "Pendente" (só na linha de Setembro): `bg-[rgba(251,191,36,0.1)]`, `border-[rgba(251,191,36,0.2)]`, `rounded-full`, `px-[9px] py-[3px]`, texto Semi Bold `11px` cor `#fbbf24`

### Animação

- Cabeçalho: `.reveal-up`
- Card da tabela: `.reveal-up` com leve delay após o cabeçalho (o Figma descreve um efeito de painéis entrando com rotação alternada — **simplificação aceita**: usar `.reveal-up` simples para o card inteiro, documentar no walkthrough que a rotação alternada por linha foi simplificada para não gerar layout thrashing em uma tabela)

---

## Passos sugeridos

1. Reabrir node `58:121` no Figma Desktop, confirmar specs
2. Criar `DashboardShowcase.tsx` com `.map()` sobre array local das 4 linhas
3. Inserir no `App.tsx` na posição correta
4. Aplicar `useScrollReveal`
5. Testar responsividade (a tabela é larga — permitir scroll horizontal em mobile com `overflow-x-auto` no container da tabela, sem quebrar o layout da página)
6. Walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] Tabela com as 4 linhas de dados exatas, badge "Pendente" só na linha correta
- [ ] Em mobile, tabela não quebra o layout da página (scroll horizontal ou adaptação razoável)
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/019-landing-redesign-how-it-works.md`](019-landing-redesign-how-it-works.md)
- Figma: node `58:121` ("dashboard-showcase")
