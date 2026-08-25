# Task 009 — Landing Page: Prova Social (Depoimentos)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 008 merged
> **Estimativa:** 3-4h
> **Branch:** `feat/009-landing-social-proof`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` na raiz do repo — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 008 está **merged**.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/009-landing-social-proof
   ```
4. Esta é a task **4 da série Landing Page** (9 tasks ao todo: 006-014).

---

## Contexto

Logo após a Hero (task 008), a seção de Prova Social reforça credibilidade: uma linha discreta de contexto, uma fileira de slots de logo (placeholders) e um grid de 3 depoimentos de clientes.

**Fonte do design:** specs extraídas via Figma MCP (`get_design_context`) do node `15:71` ("3. Prova Social"), file `47CFOJpk4Lm8LipC1pynyx`.

**Divergências encontradas vs. o pedido original** — seguindo o Figma como fonte de verdade:
1. O texto discreto no Figma é **"USADO POR EMPRESAS QUE JÁ RECUPERARAM MILHÕES EM CRÉDITO"** (maiúsculo, com tracking), não "Usado por indústrias, empresas de serviços e comércio de todo o Brasil".
2. O Figma inclui uma **fileira de 6 slots de logo** (placeholders tracejados, um deles rotulado "Fintech Parceira") entre o texto e os depoimentos — não mencionada no pedido original, mas faz parte do design.
3. Há uma linha de aviso ao final da seção: "Logos, números e depoimentos acima são placeholders de exemplo — substituir por clientes e resultados reais antes da publicação." — reproduzir também, é conteúdo real do design (nota para quando os dados reais chegarem).

Se qualquer uma dessas divergências não for desejada, pare e pergunte antes de implementar.

**Sobre o espaçamento pedido:** o padding vertical *desta seção* no Figma é `34px` (mais enxuto do que `py-16`/`py-20`), mas o respiro "generoso" em relação à Hero já vem do `pb-[64px]` da própria Hero (task 008) — a seção de Prova Social não tem borda superior, ela emenda direto no padding inferior da Hero. Portanto: **implemente o `py-[34px]` da seção conforme o Figma**; não dobre o espaçamento por conta própria.

---

## Objetivo

Implementar o componente `SocialProof` com o texto de contexto, a fileira de logos-placeholder e o grid de 3 cards de depoimento, fiel ao Figma.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/SocialProof.tsx` | Componente da seção de Prova Social |
| `app/landing-page/src/assets/avatar-placeholder.png` | Avatar genérico usado nos 3 depoimentos, baixado do Figma (ver "Assets" abaixo) |
| `app/landing-page/src/App.tsx` | Atualizado para renderizar `<SocialProof />` logo após `<Hero />` |
| `docs/tasks/walkthrough/009-landing-social-proof.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar Dor vs Solução, Features, Preço, FAQ ou Footer — tasks 010-013
- ❌ Não buscar logos reais de clientes — os slots ficam vazios/tracejados, como placeholder mesmo (é o que o design pede)
- ❌ Não trocar os depoimentos por conteúdo genérico — usar exatamente os 3 do Figma, incluindo nome e cargo
- ❌ Não remover a linha de aviso sobre os dados serem placeholders — ela é parte intencional do design
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos — specs extraídas do Figma (node 15:71)

### Container da seção

| Propriedade | Valor |
|---|---|
| Background | branco (`var(--neutral/surface)`) |
| Borda inferior | `1px solid var(--neutral/border-card, #e5e7eb)` |
| Layout | `flex-col`, `items-center`, `gap-[24px]`, `w-full` |
| Padding | `px-[48px] py-[34px]` |

### 1. Texto discreto (headline)

- "USADO POR EMPRESAS QUE JÁ RECUPERARAM MILHÕES EM CRÉDITO"
- Inter **Semi Bold**, `12px`, cor `var(--neutral/text-tertiary, #9ca3af)`, `text-center`, `tracking-[0.96px]`, `w-full`, texto em maiúsculas

### 2. Fileira de slots de logo

- Container: `flex gap-[16px] items-start w-full`
- 6 slots, cada um `flex-1`, `h-[34px]`, `border border-dashed border-[#d1d5db]` (`var(--neutral/border-input)`), `rounded-[6px]`, sem conteúdo interno (placeholder vazio)
- O último slot representa uma fintech parceira — visualmente idêntico aos demais, sem rótulo visível (é só nome interno no Figma)

### 3. Grid de depoimentos

- Container: `flex gap-[16px] items-start w-full` (3 colunas iguais no desktop via `flex-1`; empilhar em coluna no mobile)
- Cada card: `bg-white`, `border border-[#e5e7eb]` (`var(--neutral/border-card)`), `flex-1`, `flex-col`, `gap-[16px]`, `p-[20px]`, `rounded-[8px]`

**Conteúdo de cada card:**
- Texto do depoimento entre aspas: Inter **Regular**, `14px`, `leading-[1.55]`, cor `#111827`
- Rodapé do card: `flex gap-[10px] items-center`
  - Avatar circular `32x32px` (ver Assets)
  - Nome: Inter **Semi Bold**, `12.5px`, cor `#111827`
  - Cargo/empresa: Inter **Regular**, `11.5px`, cor `var(--neutral/text-secondary, #6b7280)`

**Os 3 depoimentos (copiar exatamente):**

| # | Depoimento | Nome | Cargo/Empresa |
|---|---|---|---|
| 1 | "Reduzimos 3 dias de planilha para 10 minutos por mês. O crédito que a gente perdia de vista agora aparece sozinho." | Fernanda Costa | Controller — Indústria de Embalagens |
| 2 | "A antecipação via fintech resolveu um aperto de caixa que a gente ia sentir por dois meses." | Ricardo Nunes | CFO — Distribuidora de Insumos |
| 3 | "Finalmente um painel que fala a língua do contador e do financeiro ao mesmo tempo." | Juliana Prado | Contadora — Escritório Contábil |

### 4. Linha de aviso (rodapé da seção)

- "Logos, números e depoimentos acima são placeholders de exemplo — substituir por clientes e resultados reais antes da publicação."
- Inter **Regular**, `11.5px`, cor `var(--neutral/text-tertiary, #9ca3af)`, `text-center`, `w-full`

### Assets

O avatar dos depoimentos (`imgEllipse2` no retorno do Figma MCP) é a **mesma imagem reutilizada nos 3 cards** — uma foto placeholder genérica. Baixe uma única vez e salve em `app/landing-page/src/assets/avatar-placeholder.png`, reaproveitando o import nos 3 cards (não hotlink da URL do Figma, que expira em ~7 dias).

Os slots de logo **não** precisam de asset — são caixas vazias com borda tracejada, reproduzíveis só com CSS/Tailwind.

---

## Passos sugeridos

1. Reabrir o node `15:71` no Figma Desktop (selecionar) e confirmar specs se houver dúvida
2. Baixar o avatar placeholder e salvar em `app/landing-page/src/assets/avatar-placeholder.png`
3. Criar `app/landing-page/src/components/SocialProof.tsx`
4. Implementar o texto discreto + fileira de 6 slots de logo
5. Implementar o grid de 3 cards de depoimento (usar `.map()` sobre um array local de depoimentos, evita repetição de JSX)
6. Implementar a linha de aviso final
7. Importar e renderizar `<SocialProof />` em `App.tsx`, logo após `<Hero />`
8. Testar visualmente em `npm run dev` — desktop (3 colunas) e mobile (empilhado), comparando com o screenshot do Figma
9. Criar o walkthrough em `docs/tasks/walkthrough/009-landing-social-proof.md` — **somente depois do PR aberto**
10. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 009
11. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] Texto discreto em maiúsculas, centralizado, cor cinza clara
- [ ] Fileira de 6 slots de logo com borda tracejada, distribuídos igualmente
- [ ] Grid de 3 cards de depoimento com texto exato, nome em negrito e cargo/empresa abaixo
- [ ] Avatar `32x32px` circular em cada card, usando o asset commitado (não hotlink)
- [ ] Linha de aviso sobre placeholders presente ao final da seção
- [ ] Em mobile (`< 768px`), cards empilham em coluna única
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] Commits seguem Conventional Commits
- [ ] **PR aberto antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/009-landing-social-proof.md` criado com evidências reais (screenshots comparando com o Figma)
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] Branch sincronizada com `origin/main` antes do merge
- [ ] PR contém apenas commits da task 009

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md) — sequência obrigatória de execução
- [`docs/tasks/008-landing-hero.md`](008-landing-hero.md) — task anterior da série
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `15:71` ("3. Prova Social")
